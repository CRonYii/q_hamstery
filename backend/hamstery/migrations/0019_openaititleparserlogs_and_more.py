# Generated by Django 4.2.16 on 2024-12-08 06:13

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("hamstery", "0018_hamsterysettings_openai_title_parser_prompt"),
    ]

    operations = [
        migrations.CreateModel(
            name="OpenAITitleParserLogs",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("model", models.CharField(max_length=128)),
                ("title", models.CharField(max_length=256)),
                ("episode_number", models.IntegerField(default=0)),
                ("exception", models.CharField(blank=True, default="", max_length=512)),
                ("tokens_used", models.IntegerField(default=0)),
                ("time", models.DateTimeField(auto_now_add=True)),
            ],
        ),
        migrations.AlterField(
            model_name="hamsterysettings",
            name="openai_title_parser_prompt",
            field=models.CharField(
                default='Goal: Identify the episode number from the title. The video name may follow various naming conventions and contain indicators of episode numbers in different languages (e.g., English, Chinese, Japanese, etc.). Episode numbers may be embedded in various formats, such as "EP01" or other natural language patterns\nInput: A JSON object containing the title of a video file. For example: { "title": "([POPGO][Ghost_in_the_Shell][S.A.C._2nd_GIG][08][AVC_FLACx2+AC3][BDrip][1080p][072D2CD7]).mkv" }\nResponse: A JSON object with the extracted episode number. For example: { "episode": 8 }',
                max_length=2048,
            ),
        ),
    ]
