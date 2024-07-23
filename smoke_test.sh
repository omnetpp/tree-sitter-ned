#!/bin/bash

# Check if at least two arguments (extension and one folder) are provided
if [ $# -lt 2 ]; then
  echo "Usage: $0 extension folder1 [folder2 ... folderN]"
  exit 1
fi

# Get the file extension from the first argument
extension=$1
shift

# Save the current working directory
cwd=$PWD

# Loop over all provided folders
for folder in "$@"; do
  if [ -d "$folder" ]; then
    # Change to the provided folder
    cd "$folder" || exit 1
    
    echo "Running tests in $folder:"
    # Find files with the given extension and write their absolute paths to list
    find -name "*.$extension" -exec realpath {} \; > "$cwd/list"

    # Change back to the original directory
    cd "$cwd" || exit 1

    # Run tree-sitter parse on the list
    tree-sitter parse --paths list --stat -q
  else
    echo "Error: Directory $folder does not exist."
  fi
done

# Clean up
rm "$cwd/list"
