# CLI

billy-agent includes a CLI command for managing your API key.

## Available Commands

### Set API Key

```bash
npx billy-agent config set gsk_your_api_key_here
```

Creates a `billy-agent.config.json` file in your project directory.

### Show Current Key

```bash
npx billy-agent config show
```

Displays the first 10 characters of your stored API key.

### Remove API Key

```bash
npx billy-agent config remove
```

Removes the key from `billy-agent.config.json`. If the file becomes empty, it is deleted.

### Help

```bash
npx billy-agent
```

Displays available commands.
