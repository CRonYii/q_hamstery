# Generated by Django 4.2.16 on 2024-12-08 20:16

from django.db import migrations, models
import django.db.models.deletion


def migrate_tvdownloads(apps, schema_edtior):
    Download = apps.get_model('hamstery', 'Download')
    TvDownload = apps.get_model('hamstery', 'TvDownload')
    TvEpisodeDownload = apps.get_model('hamstery', 'TvEpisodeDownload')
    MonitoredTvDownload = apps.get_model('hamstery', 'MonitoredTvDownload')
    MonitoredTvEpisodeDownload = apps.get_model(
        'hamstery', 'MonitoredTvEpisodeDownload')
    for mon in MonitoredTvDownload.objects.all():
        new_dl = Download.objects.create(hash=mon.hash, done=mon.done)
        MonitoredTvEpisodeDownload.objects.create(
            task=new_dl, episode=mon.episode, filename=mon.filename, subscription=mon.subscription)
    for dl in TvDownload.objects.all():
        if MonitoredTvDownload.objects.filter(hash=dl.hash).exists():
            continue
        new_dl = Download.objects.create(hash=dl.hash, done=dl.done)
        TvEpisodeDownload.objects.create(
            task=new_dl, episode=dl.episode, filename=dl.filename)


def migrate_tvdownloads_reverse(apps, schema_edtior):
    Download = apps.get_model('hamstery', 'Download')
    TvDownload = apps.get_model('hamstery', 'TvDownload')
    TvEpisodeDownload = apps.get_model('hamstery', 'TvEpisodeDownload')
    MonitoredTvDownload = apps.get_model('hamstery', 'MonitoredTvDownload')
    MonitoredTvEpisodeDownload = apps.get_model(
        'hamstery', 'MonitoredTvEpisodeDownload')
    for mon_ep in MonitoredTvEpisodeDownload.objects.all():
        dl = mon_ep.task
        MonitoredTvDownload.objects.create(
            hash=dl.hash, done=dl.done, episode=mon_ep.episode, filename=mon_ep.filename, subscription=mon_ep.subscription)
    for ep_dl in TvEpisodeDownload.objects.all():
        dl = ep_dl.task
        if MonitoredTvDownload.objects.filter(hash=dl.hash).exists():
            continue
        TvDownload.objects.create(
            hash=dl.hash, done=dl.done, episode=ep_dl.episode, filename=ep_dl.filename)


class Migration(migrations.Migration):

    dependencies = [
        ("hamstery", "0020_remove_hamsterysettings_openai_title_parser_prompt"),
    ]

    operations = [
        migrations.CreateModel(
            name="Download",
            fields=[
                (
                    "hash",
                    models.CharField(
                        max_length=256, primary_key=True, serialize=False),
                ),
                ("done", models.BooleanField(default=False)),
            ],
        ),
        migrations.CreateModel(
            name="TvEpisodeDownload",
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
                (
                    "episode",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        parent_link=True,
                        related_name="downloads",
                        to="hamstery.tvepisode",
                    ),
                ),
                ("filename", models.CharField(
                    blank=True, default="", max_length=4096)),
                (
                    "task",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="hamstery.download",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="MonitoredTvEpisodeDownload",
            fields=[
                (
                    "tvepisodedownload_ptr",
                    models.OneToOneField(
                        auto_created=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        parent_link=True,
                        primary_key=True,
                        serialize=False,
                        to="hamstery.tvepisodedownload",
                    ),
                ),
                (
                    "subscription",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.DO_NOTHING,
                        parent_link=True,
                        related_name="downloads",
                        to="hamstery.showsubscription",
                    ),
                ),
            ],
            bases=("hamstery.tvepisodedownload",),
        ),
        migrations.RunPython(migrate_tvdownloads, migrate_tvdownloads_reverse),
        migrations.DeleteModel(
            name="MonitoredTvDownload",
        ),
        migrations.DeleteModel(
            name="TvDownload",
        ),
    ]
