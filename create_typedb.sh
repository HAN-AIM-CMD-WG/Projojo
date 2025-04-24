#!/bin/bash

# Stop and remove the existing TypeDB container
echo -n "Stopping container: "
docker container stop typedb || true
echo -n "Removing container: "
docker container remove typedb --force || true

# Handle reset-volume argument
if [[ "$*" == *reset-volume* ]]; then
    echo -n "Removing volume: "
    docker volume remove typedb-data --force || true
fi

# Check if the volume exists, create if not
docker volume inspect typedb-data > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo -n "Creating volume:"
    docker volume create typedb-data
fi

# download the correct image
echo -n "Downloading image: "
docker image pull --quiet typedb/typedb:3.1.0
# Create the new container with the (new) volume
echo -n "Creating container: "
docker container create --name typedb \
                        --restart unless-stopped \
                        --volume typedb-data:/opt/typedb-all-linux-x86_64/server/data \
                        --publish 1729:1729 \
                        --platform linux/amd64 \
                        typedb/typedb:3.1.0
# start the db
echo -n "Starting container: "
docker container start typedb