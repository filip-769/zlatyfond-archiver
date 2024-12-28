# Zlatý fond archiver

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