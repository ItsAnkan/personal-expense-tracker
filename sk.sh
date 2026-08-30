#!/usr/bin/env bash
set -e

SKILLS_DIR="$HOME/.claude/skills"

mkdir -p "$SKILLS_DIR"

echo "Installing Claude skills..."

# Anthropic frontend-design
if [ ! -d "$SKILLS_DIR/frontend-design" ]; then
    git clone --depth 1 \
        https://github.com/anthropics/skills.git \
        /tmp/anthropic-skills

    cp -R /tmp/anthropic-skills/skills/frontend-design \
        "$SKILLS_DIR/frontend-design"

    rm -rf /tmp/anthropic-skills
else
    echo "frontend-design already installed"
fi

# Dawitlabs UI skills
if [ ! -d "/tmp/ui-skills" ]; then
    git clone --depth 1 \
        https://github.com/dawitlabs/ui-skills.git \
        /tmp/ui-skills
fi

for skill in ui-init design-grill uiux a11y tokens; do
    if [ -d "/tmp/ui-skills/skills/$skill" ]; then
        rm -rf "$SKILLS_DIR/$skill"
        cp -R "/tmp/ui-skills/skills/$skill" "$SKILLS_DIR/$skill"
        echo "Installed: $skill"
    else
        echo "Warning: $skill not found"
    fi
done

rm -rf /tmp/ui-skills

echo ""
echo "Done. Installed skills:"
echo "  - frontend-design"
echo "  - ui-init"
echo "  - design-grill"
echo "  - uiux"
echo "  - a11y"
echo "  - tokens"
echo ""
echo "Restart Claude Code to load the skills."