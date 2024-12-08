import logging
from django.core.management import call_command

from django.core.management.base import BaseCommand
from django.db.migrations.recorder import MigrationRecorder

logger = logging.getLogger(__name__)

app_name = "hamstery"


class Command(BaseCommand):
    help = 'Downgrade q-hamstery to a specific version. Run with BUILDING=True environment variable.'

    def add_arguments(self, parser) -> None:
        parser.add_argument("version",
                            type=str,
                            help="The q-hamstery version to be downgraded to. Example: v0.1.0")

    def handle(self, *args, **options):
        version = options["version"]
        with open("migration-version.ini", 'r') as f:
            migration_version_map = dict(line.strip().split('=') for line in f if '=' in line)
        if version not in migration_version_map:
            logger.error("%s is not a valid version" % (version))
            return
        downgrade_to_name = migration_version_map[version]

        # Print current database migration information
        current_migration = MigrationRecorder.Migration.objects.filter(
            app=app_name).latest('id')
        if not current_migration:
            logger.error("The database does not have any migrations applied. Abort.")
            return
        cur_version = "<unknown>"
        for version in migration_version_map:
            if migration_version_map[version] == current_migration.name:
                cur_version = version
                break
        logger.info("Database currently running %s (%s)" % (cur_version, current_migration.name))
        if cur_version == "<unknown>":
            logger.warning("You may be running a dev version of Hamstery")
        
        # Get target migration to downgrade to
        downgrade_migration = MigrationRecorder.Migration.objects.filter(
            app=app_name, name=downgrade_to_name).first()
        if not downgrade_migration:
            logger.error("The database does not have the targeted downgrade migration for %s (%s)" % (
                version, downgrade_to_name))
            return
        if not downgrade_migration.applied:
            logger.error(
                "The database is running at a version older than %s already" % version)
            return
        # Perform downgrade
        logger.info("CAUTION: ")
        logger.info("Make sure you backup your data before proceeding!")
        logger.info("You could lose your data if fail to do so!")
        ans = input("I have already backup my data [y/N]")
        if ans.lower() != 'y':
            return
        logger.info("Downgrading to %s (%s)" % (version, downgrade_migration))
        ans = input("Confirm downgrade to %s [y/N]" % (version))
        if ans.lower() != 'y':
            return
        call_command('migrate', app_name, downgrade_migration.name)
        logger.info(
            "Database downgrade has completed. Please proceed to downgrade q-hamstery software.")
