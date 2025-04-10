# Projojo

To make this work, you need:
* a Mac or Linux shell. (Perhaps Git-Bash can run this on Windows? Or WSL?)
* Docker or Docker Desktop installed.
* Node 22 (or higher)
* Python 3.13 (or higher)

## Setting up the TypeDB Database

Use `./create_typedb.sh` to download the latest TypeDB as a container and set it up with a Docker volume called 'typedb-data':


```bash
# Basic setup - creates and configures the TypeDB container
./create_typedb.sh

# Reset volume - removes any existing data and creates a fresh volume in addition to a new container
./create_typedb.sh reset-volume
```

The script will:
1. Create a Docker volume for TypeDB data persistence (if needed or requested)
2. Pull the latest TypeDB Docker image
3. Create a TypeDB container with port 1729 exposed
4. Mount the data volume to maintain data between container restarts

The script is also useful to upgrade TypeDB to a higher version.
Use the `reset-volume` option when you need to clear all existing TypeDB data and start fresh.

## Running the project

Use `./start.sh` (Mac/Linux) to run the app. The script will: 
1. The frontend server
2. The backend server
3. The TypeDB container.

A browser tab should open automatically.
