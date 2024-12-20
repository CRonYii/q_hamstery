# Generated by Django 4.2.16 on 2024-12-07 06:54

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("hamstery", "0017_alter_tvshow_lib"),
    ]

    operations = [
        migrations.AddField(
            model_name="hamsterysettings",
            name="openai_title_parser_prompt",
            field=models.CharField(
                default='You are an API that receives user input in JSON format and processes it to extract episode numbers from video file titles, responding only in JSON format.\nInput: A JSON object containing the title of a video file, for example: { "title": "([POPGO][Ghost_in_the_Shell][S.A.C._2nd_GIG][08][AVC_FLACx2+AC3][BDrip][1080p][072D2CD7]).mkv" }.\nGoal: Identify the episode number from the title. The video name may follow various naming conventions and may contain indicators of episode numbers in different languages (e.g., English, Chinese, Japanese, etc.). Episode numbers may be embedded in different formats, such as "EP01" or other natural language patterns.\nResponse: A JSON object with the extracted episode number. For example: { "episode": 8 }.\nError Handling: If the input format is incorrect or if an episode number cannot be determined, respond with { "error": "<an error message>", "episode": null }.\nImportant: Always respond in JSON format without any additional text.',
                max_length=2048,
            ),
        ),
    ]
