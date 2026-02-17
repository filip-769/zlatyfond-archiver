# Zlatý fond archiver

> [!IMPORTANT]
> This tool no longer works. You can download the last archive I made below:

```
magnet:?xt=urn:btih:41ffa6b9bb33852b98c6fd1962acb13dd0d8a206&dn=zlatyfond.sme.sk-2025-01-10.zim&xl=154018013&tr=http%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce
```

___

This is a simple program to scrape https://zlatyfond.sme.sk/ and compress everything into one .zim file.

## Prerequisites
- Deno (https://deno.com/)
- zim-tools (https://github.com/openzim/zim-tools)

## Running

> Make sure you have a clean IP address because the website is behind Cloudflare.

1. `deno run -A main.ts`
2. Enter the your name (this will be used in the publisher field of the .zim file)
3. Wait (it will take a really long time if you do not have the .html files downloaded already)

The output will be in `zlatyfondsme.zim`
