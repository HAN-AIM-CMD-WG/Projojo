#!/bin/bash

# Stop and remove the existing TypeDB container and image
docker stop typedb || true
docker rm typedb --force || true
docker rmi typedb/typedb:latest --force || true
docker rmi typedb/typedb:3.1.0 --force || true

# Handle reset-volume argument
if [[ "$*" == *reset-volume* ]]; then
    docker volume rm typedb-data --force || true
fi

# Check if the volume exists, create if not
docker volume inspect typedb-data > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "Creating volume 'typedb-data'..."
    docker volume create typedb-data
fi

# Create the new container with the (new) volume
docker create --name typedb -v typedb-data:/opt/typedb-all-linux-x86_64/server/data -p 1729:1729 --platform linux/amd64 typedb/typedb:3.2.0
