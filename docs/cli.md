# CLI

billy-agent includes a CLI command for managing your API key.

## Available Commands

### Set API Key

```bash
npx billy-agent config set gsk_your_api_key_here
```

Saves your API key to `~/.billy-agent/config.json`.

> **⚠️ Security note:** The key is stored in **plain text** in your home directory.
> For production and CI/CD, use environment variables instead.

### Show Current Key

```bash
npx billy-agent config show
```

Displays a masked version showing only the first and last 4 characters.

### Remove API Key

```bash
npx billy-agent config remove
```

Removes the key from `~/.billy-agent/config.json`.

### Help

```bash
npx billy-agent
```

Displays available commands.
