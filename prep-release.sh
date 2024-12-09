#/bin/bash

if [ ! -f ".version" ]; then
    echo "ERROR: .version file missing"
    exit 1
fi

semver_regex="^v([0-9]+)\.([0-9]+)\.([0-9]+)$"
cur_ver=$(cat .version)

if [[ $cur_ver =~ $semver_regex ]]; then
    file_major="${BASH_REMATCH[1]}"
    file_minor="${BASH_REMATCH[2]}"
    file_patch="${BASH_REMATCH[3]}"
    echo "Current Version: $cur_ver"
    # Check if current branch is main
    git_branch=$(git branch --show-current)
    if [[ $git_branch != "main" ]];  then
        echo "You are not on the main branch, cannot release"
        exit 1
    fi
    # Check if working tree is clean
    git_status=$(git status -s)
    if [[ $git_status ]]; then
        echo "Current working tree is not clean, please resolve first"
        exit 1
    fi
    # Check if HEAD has been tagged with a release
    cur_tags=$(git tag --points-at HEAD --list v*.*.*)
    if [[ $cur_tags ]]; then
        echo "ERROR: HEAD is already tagged with a version $cur_tags, please check"
        exit 1
    fi
    # Check if local is up to date with remote
    git fetch
    if [ -n "$(git rev-list @..@{u})" ]; then
        echo "Local branch is behind remote. Please git pull first."
        exit 1
    fi
    # Show all changes for this release
    git log @{u}..@

    # Prepare for next release
    echo "MAJOR version when you make incompatible API changes"
    echo "MINOR version when you add functionality in a backward compatible manner"
    echo "PATCH version when you make backward compatible bug fixes"
    while : ; do
        read -p "The next release is? (major/minor/patch) > " release
        if [[ $release == "major" ]]; then
            file_major=$(($file_major+1))
            file_minor=0
            file_patch=0
            break
        elif [[ $release == "minor" ]]; then
            file_minor=$(($file_minor+1))
            file_patch=0
            break
        elif [[ $release == "patch" ]]; then
            file_patch=$(($file_patch+1))
            break
        else
            echo "Incorrect input"
        fi
    done
    new_ver=v$file_major.$file_minor.$file_patch
    echo "You are going to release a $release version $new_ver"
    echo "Going to release Version: v$file_major.$file_minor.$file_patch"
    release_tags=$(git tag HEAD --list $new_ver)
    if [[ $release_tags ]]; then
        echo "ERROR: version tag $new_ver already exists, please check"
        exit 1
    fi
    read -p "Confirm? (y/n) > " confirm
    confirm="${confirm,,}"
    if [[ $confirm != "y" ]]; then
        echo "Operation Aborted"
        exit 0
    fi
    # Perform version tagging
    echo $new_ver > .version
    # webapp
    cd webapp
    npm version $new_ver
    cd ..
    # backend
    cd backend
    latest_migration_path=$(ls -I __init__.py -I __pycache__ -1 hamstery/migrations/ | sort -r | head -n 1)
    latest_migration_name=$(basename -s .py $latest_migration_path)
    echo "$new_ver=$latest_migration_name" >> "migration-version.ini"
    echo "Tagged backend migration for downgrade $new_ver=$latest_migration_name"
    cd ..
    # Tag and commit the version change
    git diff
    read -p "Confirm commit? (y/n) > " confirm
    confirm="${confirm,,}"
    if [[ $confirm != "y" ]]; then
		git checkout -- .
        echo "Operation Aborted"
        exit 0
    fi
    git add .version webapp/package.json webapp/package-lock.json backend/migration-version.ini
    git commit -m "Release $new_ver"
    git tag $new_ver
    cur_tags=$(git tag --points-at HEAD --list v*.*.*)
    if [[ $cur_tags != $new_ver ]]; then
        echo "ERROR: Failed to git tag: $cur_tag != $new_ver"
        exit 1
    fi
    echo "Done tagging new release to $new_ver"
    git show HEAD
    echo "
Release preparation is done, please double check and push with

    git push --atomic origin main $new_ver"
else
    echo "ERROR: invalid version number read from .version: $cur_ver"
    exit 1
fi
