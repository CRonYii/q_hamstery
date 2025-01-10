# Generated by Django 4.2.16 on 2024-12-08 20:18

from django.db import migrations, models

from hamstery.custom_migrations import AlterModelBases


class Migration(migrations.Migration):

    dependencies = [
        (
            "hamstery",
            "0021_download_tvepisodedownload_remove_tvdownload_episode_and_more",
        ),
    ]

    operations = [
        # https://stackoverflow.com/questions/61665607/renaming-a-django-superclass-model-and-updating-the-subclass-pointers-correctly

        # Step 1: First, we rename the parent links in our
        # subclasses to match their future name:
        migrations.RenameField(
            model_name="monitoredtvepisodedownload",
            old_name="tvepisodedownload_ptr",
            new_name="tvdownload_ptr",
        ),
        # Step 2: then, temporarily set the base model for
        #         our subclassses to just `Model`, which makes
        #         Django think there are no parent links, which
        #         means it won't try to apply crashing logic in step 3.
        AlterModelBases("MonitoredTvEpisodeDownload", (models.Model,)),

        # Step 3: Now we can safely rename the superclass without
        #         Django trying to fix subclass pointers:
        migrations.RenameModel(
            old_name="TvEpisodeDownload",
            new_name="TvDownload",
        ),

        # Step 4: Which means we can now update the `parent_link`
        #         fields for the subclasses: even though we altered
        #         the model bases earlier, this step will restore
        #         the class hierarchy we actually need:
        migrations.AlterField(
            model_name='monitoredtvepisodedownload',
            name='tvdownload_ptr',
            field=models.OneToOneField(
                auto_created=True,
                on_delete=models.deletion.CASCADE,
                parent_link=True,
                primary_key=True,
                serialize=False,
                to="hamstery.tvdownload",
            ),
        ),

        # All done. Do other things.
        migrations.RenameModel(
            old_name="MonitoredTvEpisodeDownload",
            new_name="MonitoredTvDownload",
        ),
    ]