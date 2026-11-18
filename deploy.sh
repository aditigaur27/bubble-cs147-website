#!/bin/bash
# Uploads site/ to the team's AFS webspace.
#   Usage: ./deploy.sh YOUR_SUNETID
# Asks for your Stanford password and a Duo approval.
# Live at https://web.stanford.edu/class/cs147/projects/DesignforMeaningfulWork/Bubble/
set -e
if [ -z "$1" ]; then echo "Usage: ./deploy.sh YOUR_SUNETID"; exit 1; fi
cd "$(dirname "$0")"
rsync -rtv --exclude .DS_Store site/ \
  "$1@rice.stanford.edu:/afs/ir/class/cs147/WWW/projects/DesignforMeaningfulWork/Bubble/"
echo "Done: https://web.stanford.edu/class/cs147/projects/DesignforMeaningfulWork/Bubble/"
