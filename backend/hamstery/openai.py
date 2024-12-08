import json
import logging
import traceback
from functools import lru_cache

from django.conf import settings
from openai import OpenAI
from openai.types import Model

from hamstery.hamstery_settings import SettingsHandler, settings_manager
from hamstery.models.settings import HamsterySettings
from hamstery.models.stats import HamsteryStats

logger = logging.getLogger(__name__)

# Will only support specific models (Need JSON Mode)
# Do not add model pointers like 'gpt-3.5-turbo' since those are subject to change
supported_models = [
    'gpt-4-0125-preview',  # 2024-01-25
    'gpt-4-1106-preview',  # 2023-11-06
    'gpt-3.5-turbo-0125',  # 2024-01-25
    'gpt-3.5-turbo-1106',  # 2023-11-06
    'gpt-4o-2024-08-06',
    'gpt-4o-2024-05-13',
    'gpt-4o-mini-2024-07-18',
]

JSON_MODE_PROMPT = '''You are an API that receives user input in JSON format and respond only in JSON format. If the input format is incorrect or if you cannot determine a proper response from the input, respond with { "error": "<error msg>" }
'''

class OpenAIException(Exception):
    def __init__(self, message):
        super().__init__(message)


def is_supported_model(model: Model):
    for id in supported_models:
        if model.id.startswith(id):  # to support fine-tuned models
            return True
    return False


class OpenAIManager:

    enable_handle_title = False

    def __init__(self):
        if settings.BUILDING is True:
            return
        instance = settings_manager.settings
        self.load_client(instance)
        settings_manager.register_settings_handler(SettingsHandler([
            'openai_api_key', 'openai_title_parser_mode', 'openai_title_parser_model',
        ], self.on_openai_config_update))

    def load_client(self, instance: HamsterySettings):
        self.client = OpenAI(api_key=instance.openai_api_key)
        self.enable_openai = instance.openai_api_key != ''
        self.enable_handle_title = self.enable_openai and (
            instance.openai_title_parser_mode != HamsterySettings.TitleParserMode.DISABLED) and (instance.openai_title_parser_model != '')

    def on_openai_config_update(self, instance: HamsterySettings):
        logger.info(
            'Detected OpenAI configuration changes, loading new OpenAI client...')
        self.load_client(instance)

    def list_models(self):
        if not self.enable_openai:
            return []
        openai_models = self.client.models.list()
        models = (filter(is_supported_model,  openai_models))
        return [{'id': model.id, 'created': model.created, 'owned_by': model.owned_by} for model in models]

    @lru_cache(maxsize=128)
    def __chatgpt_json_response(self, model: str, prompt: str, data: str) -> dict:
        response = self.client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "system",
                    "content": JSON_MODE_PROMPT + prompt
                },
                {
                    "role": "user",
                    "content": data
                },
            ],
            response_format={"type": "json_object"},
        )

        choice = response.choices[0]
        # We are not handling finish_reason=length since it's not very likely to happen for a single episode name parsing
        if choice.finish_reason != "stop":
            raise OpenAIException("OpenAI API failed with: %s" %
                                  (choice['finish_reason']))
        try:
            content = json.loads(choice.message.content)
        except:
            raise OpenAIException("Faile to decode ChatGPT JSON response: %s" %
                                  (choice.message.content))
        if 'error' in content:
            raise OpenAIException(
                "OpenAI ChatGPT failed to extract episode number: %s" % (content['error']))

        return content, response

    def get_episode_number_from_title(self, title: str) -> int:
        if self.enable_handle_title is False:
            return None
        settings = settings_manager.settings
        model = settings.openai_title_parser_model
        prompt = settings.openai_title_parser_prompt
        stats = HamsteryStats.singleton()
        try:
            logger.info(
                "Querying OpenAI ChatCompletion API Model '%s' to extract episode number from '%s'" % (model, title))
            stats.update_title_parser_stats(calls=1)
            content, response = self.__chatgpt_json_response(
                model, prompt, '{ "title": "%s" }' % (title)
            )
            if response.usage:
                stats.update_title_parser_stats(prompt_tokens=response.usage.prompt_tokens,
                                                completion_tokens=response.usage.completion_tokens,
                                                total_tokens=response.usage.total_tokens)
            episode_number = content['episode']
            logger.info("OpenAI ChatCompletion extracted '%s' from '%s'" %
                        (episode_number, title))
            return episode_number
        except Exception:
            stats.update_title_parser_stats(fails=1)
            logger.error(traceback.format_exc())
            return None


openai_manager = OpenAIManager()
