# Generated by Django 4.2.16 on 2024-12-08 20:16

from django.db import migrations, models
import django.db.models.deletion
import logging

logger = logging.getLogger(__name__)


def migrate_tvdownloads(apps, schema_edtior):
    Download = apps.get_model('hamstery', 'Download')
    TvDownload = apps.get_model('hamstery', 'TvDownload')
    TvEpisodeDownload = apps.get_model('hamstery', 'TvEpisodeDownload')
    MonitoredTvDownload = apps.get_model('hamstery', 'MonitoredTvDownload')
    MonitoredTvEpisodeDownload = apps.get_model(
        'hamstery', 'MonitoredTvEpisodeDownload')
    for mon in MonitoredTvDownload.objects.all():
        new_dl = Download.objects.create(
            hash=mon.hash, name=mon.filename, completed=mon.done, fetched=mon.done)
        MonitoredTvEpisodeDownload.objects.create(
            task=new_dl, episode=mon.episode, filename=mon.filename, subscription=mon.subscription, done=mon.done)
    for dl in TvDownload.objects.all():
        if MonitoredTvDownload.objects.filter(hash=dl.hash).exists():
            continue
        new_dl = Download.objects.create(
            hash=dl.hash, name=dl.filename, completed=dl.done, fetched=dl.done)
        TvEpisodeDownload.objects.create(
            task=new_dl, episode=dl.episode, filename=dl.filename, done=dl.done)


def migrate_tvdownloads_reverse(apps, schema_edtior):
    TvDownload = apps.get_model('hamstery', 'TvDownload')
    TvEpisodeDownload = apps.get_model('hamstery', 'TvEpisodeDownload')
    MonitoredTvDownload = apps.get_model('hamstery', 'MonitoredTvDownload')
    MonitoredTvEpisodeDownload = apps.get_model(
        'hamstery', 'MonitoredTvEpisodeDownload')
    for mon_ep in MonitoredTvEpisodeDownload.objects.all():
        dl = mon_ep.task
        if TvDownload.objects.filter(hash=dl.hash).exists():
            logger.warning('Skip reverting download "%s" for Episode "%s" since this hamstery version only supported 1 file in 1 download' % (
                mon_ep.filename, mon_ep.episode))
            continue
        MonitoredTvDownload.objects.create(
            hash=dl.hash, done=mon_ep.done, episode=mon_ep.episode, filename=mon_ep.filename, subscription=mon_ep.subscription)
    for ep_dl in TvEpisodeDownload.objects.all():
        dl = ep_dl.task
        if MonitoredTvEpisodeDownload.objects.filter(tvepisodedownload_ptr_id=ep_dl.id).exists():
            continue
        if TvDownload.objects.filter(hash=dl.hash).exists():
            logger.warning('Skip reverting download "%s" for Episode "%s" since this hamstery version only supported 1 file in 1 download' % (
                ep_dl.filename, ep_dl.episode))
            continue
        TvDownload.objects.create(
            hash=dl.hash, done=ep_dl.done, episode=ep_dl.episode, filename=ep_dl.filename)


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
                (
                    'completed',
                    models.BooleanField(default=False),
                ),
                (
                    'fetched',
                    models.BooleanField(default=False),
                ),
                (
                    'name',
                    models.CharField(blank=True, default='', max_length=4096),
                ),
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
                ("file_index", models.IntegerField(default=-1)),
                ("filename", models.CharField(
                    blank=True, default="", max_length=4096)),
                (
                    "task",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="hamstery.download",
                    ),
                ),
                ("done", models.BooleanField(default=False)),
                ("error", models.BooleanField(default=False)),
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
                ("auto_matched", models.BooleanField(default=False)),
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
