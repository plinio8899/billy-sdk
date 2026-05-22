# CLI

billy-sdk includes a CLI command for managing your API key.

## Available Commands

### Set API Key

```bash
npx billy-sdk config set gsk_your_api_key_here
```

Saves your API key to `~/.billy-sdk/config.json`.

> **⚠️ Security note:** The key is stored in **plain text** in your home directory.
> For production and CI/CD, use environment variables instead.

### Show Current Key

```bash
npx billy-sdk config show
```

Displays a masked version showing only the first and last 4 characters.

### Remove API Key

```bash
npx billy-sdk config remove
```

Removes the key from `~/.billy-sdk/config.json`.

### Help

```bash
npx billy-sdk
```

Displays available commands.
