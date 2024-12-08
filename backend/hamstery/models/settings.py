from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from hamstery.models.singleton import SingletonModel


OPENAI_TITLE_PARSER_DEFAULT_PROMPT = '''Goal: Identify the episode number from the title. The video name may follow various naming conventions and contain indicators of episode numbers in different languages (e.g., English, Chinese, Japanese, etc.). Episode numbers may be embedded in various formats, such as "EP01" or other natural language patterns
Input: A JSON object containing the title of a video file. For example: { "title": "([POPGO][Ghost_in_the_Shell][S.A.C._2nd_GIG][08][AVC_FLACx2+AC3][BDrip][1080p][072D2CD7]).mkv" }
Response: A JSON object with the extracted episode number. For example: { "episode": 8 }'''


class HamsterySettings(SingletonModel):
    qbittorrent_host = models.CharField(
        max_length=2048, blank=True, default='')
    qbittorrent_port = models.CharField(
        max_length=5, blank=True, default='')
    qbittorrent_username = models.CharField(
        max_length=255, blank=True, default='')
    qbittorrent_password = models.CharField(
        max_length=255, blank=True, default='')

    plex_enable = models.BooleanField(default=False)
    plex_url = models.CharField(
        max_length=2048, blank=True, default='')
    plex_token = models.CharField(
        max_length=2048, blank=True, default='')

    openai_api_key = models.CharField(
        max_length=2048, blank=True, default='')

    class TitleParserMode(models.IntegerChoices):
        DISABLED = 1
        PRIMARY = 2
        STANDBY = 3
    openai_title_parser_mode = models.IntegerField(
        choices=TitleParserMode.choices, default=TitleParserMode.DISABLED)
    openai_title_parser_model = models.CharField(
        max_length=255, blank=True, default='')
    openai_title_parser_prompt = models.CharField(
        max_length=2048, default=OPENAI_TITLE_PARSER_DEFAULT_PROMPT)

    def __str__(self) -> str:
        return 'Hamstery Settings'
