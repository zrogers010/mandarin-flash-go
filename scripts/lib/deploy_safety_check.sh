#!/usr/bin/env bash
#
# Deploy safety check function
# Ensures deployment is run from the same directory as the live containers
#

deploy_safety_check() {
    local DOCKER="$1"
    local PROJECT_DIR="$2"
    
    # Inspect the live mf_backend container directly by name
    INSPECT_RC=0
    INSPECT_OUTPUT=$($DOCKER inspect mf_backend --format '{{index .Config.Labels "com.docker.compose.project.working_dir"}}' 2>&1) || INSPECT_RC=$?

    if [ $INSPECT_RC -eq 0 ]; then
        # Container exists and was inspected successfully
        LIVE_DIR="$INSPECT_OUTPUT"
        if [ -n "$LIVE_DIR" ] && [ "$LIVE_DIR" != "$PROJECT_DIR" ]; then
            echo "ERROR: Running containers were started from a different directory!"
            echo "  This checkout: $PROJECT_DIR"
            echo "  Live containers: $LIVE_DIR"
            echo ""
            echo "You must run deploy.sh from $LIVE_DIR to avoid breaking SSL certs and mounts."
            return 1
        fi
    elif echo "$INSPECT_OUTPUT" | grep -q "No such object\|no such image\|Error: No such container"; then
        # Container doesn't exist - this is a fresh install, which is allowed
        echo "  No existing mf_backend container found (fresh install)"
    else
        # Inspect failed for another reason (can't reach docker, permission denied, etc)
        echo "ERROR: Cannot inspect mf_backend container"
        echo "  $INSPECT_OUTPUT"
        echo "  Cannot safely determine if this is the correct deployment directory."
        return 1
    fi
    
    return 0
}
