#!/bin/bash

echo "Starting update of static resources..."

set -e

cd /home/pi/web/TimetableSync/cli

echo ">> Starting to Process Courses"
./GetCourses
mv courses.json ../lists/
echo "<< Finished Processing Courses"

echo ">> Starting to Process Modules"
./GetModules
mv modules.json ../lists/
echo "<< Finished Processing Modules"

echo ">> Starting to Process Rooms"
./GetRooms
mv rooms.json ../lists/
echo "<< Finished Processing Rooms"

pm2 restart 17

curl -d "✅ Updated Static Information on TS" https://notifications.elliee.me/updates
