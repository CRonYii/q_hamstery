import json
import logging
import traceback
from functools import lru_cache

from django.conf import settings
from openai import OpenAI
from openai.types import Model

from hamstery import utils
from hamstery.hamstery_settings import SettingsHandler, settings_manager
from hamstery.models.settings import HamsterySettings
from hamstery.models.stats import HamsteryStats, OpenAITitleParserLogs

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

JSON_MODE_PROMPT = '''You are an API that receives user input in JSON format and respond only in JSON format. If the input format is incorrect or if you cannot determine a proper response from the input, respond with { "error": "<error msg>" }'''

OPENAI_TITLE_PARSER_DEFAULT_PROMPT = '''Extract the episode number from a video file title. The title may use various naming conventions, languages (English, Chinese, Japanese, etc.), and include episode numbers in different formats (e.g., "EP01", numerical patterns).
Input: A JSON object with a "title" field containing the video file name, which may or may not include an episode number.
Example input:
{ "title": "([POPGO][Ghost_in_the_Shell][S.A.C._2nd_GIG][08][AVC_FLACx2+AC3][BDrip][1080p][072D2CD7]).mkv" }
Output: A JSON object with the extracted episode number and a confidence score between 1 and 100.
Example output:
{ "episode": 8, "score": 88 }
'''

class OpenAIException(Exception):
    def __init__(self, response, message):
        self.response = response
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
        self.client = OpenAI(api_key=instance.openai_api_key, timeout=10) # Set a timeout in case OpenAI API is broken
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

    @lru_cache(maxsize=256)
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
            raise OpenAIException(response, "OpenAI API failed with: %s" %
                                  (choice['finish_reason']))
        try:
            content = json.loads(choice.message.content)
        except:
            raise OpenAIException(response, "Faile to decode ChatGPT JSON response: %s" %
                                  (choice.message.content))
        if 'error' in content:
            raise OpenAIException(response,
                                  "OpenAI ChatGPT failed to extract episode number: %s" % (content['error']))

        return content, response

    def get_episode_number_from_title(self, title: str) -> int:
        if self.enable_handle_title is False:
            return None
        episode_number = None
        response = None
        error = None
        settings = settings_manager.settings
        model = settings.openai_title_parser_model
        stats = HamsteryStats.singleton()
        try:
            logger.info(
                "Querying OpenAI ChatCompletion API Model '%s' to extract episode number from '%s'" % (model, title))
            stats.update_title_parser_stats(calls=1)
            content, response = self.__chatgpt_json_response(
                model, OPENAI_TITLE_PARSER_DEFAULT_PROMPT, '{ "title": "%s" }' % (title)
            )
            if response.usage:
                stats.update_title_parser_stats(prompt_tokens=response.usage.prompt_tokens,
                                                completion_tokens=response.usage.completion_tokens,
                                                total_tokens=response.usage.total_tokens)
            episode_number = int(content['episode'])
            score = 0
            if 'score' in content:
                score = int(content['score'])
            logger.info("OpenAI ChatCompletion extracted '%s' from '%s'" %
                        (episode_number, title))
        except OpenAIException as e:
            stats.update_title_parser_stats(fails=1)
            error = str(e)
            logger.error(error)
            response = e.response
        except Exception as e:
            error = str(e)
            stats.update_title_parser_stats(fails=1)
            logger.error(traceback.format_exc())
        log = OpenAITitleParserLogs(
            model=model,
            title=title,
        )
        if episode_number:
            log.episode_number = episode_number
        if response and response.usage:
            log.tokens_used = response.usage.total_tokens
        if error:
            log.exception = error
        log.save()
        return episode_number, score


openai_manager = OpenAIManager()
