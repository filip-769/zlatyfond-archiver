import { DOMParser, Text } from "jsr:@b-fuze/deno-dom@0.1.48";
import ProgressBar from "jsr:@deno-library/progress@1.5.1";

const headers: any = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:133.0) Gecko/20100101 Firefox/133.0",
}

const username = prompt("Enter your username") || "Anonymous";

const list: string[] = [];

console.log("Generating main page...");

await generateMainPage();

const progress = new ProgressBar({
    title: "Downloading:",
    total: list.length
})

for(const urlIndex in list) {
    try {
        await downloadAsHTML(list[urlIndex]);
    } catch (_) {}
    await progress.render(+urlIndex + 1);
}

try {
    await Deno.remove("zlatyfondsme.zim");
} catch (_) {}

console.log("Creating ZIM file...");

new Deno.Command("zimwriterfs", {
    args: [
        "--welcome", "index.html",
        "--illustration", "../logo.png",
        "--language", "slk",
        "--title", "Zlatý fond denníka SME",
        "--description", "Diela zo Zlatého fondu denníka SME",
        "--longDescription", "Diela zo Zlatého fondu denníka SME (https://zlatyfond.sme.sk/) pod licenciou CC BY-NC-ND 2.5",
        "--creator", "SME.sk",
        "--publisher", username,
        "--name", "zlatyfondsme",
        "--source", "https://zlatyfond.sme.sk/",
        "./files",
        "zlatyfondsme.zim"
    ]
}).outputSync()

console.log("Removing failed downloads...");

await removeFailed();

console.log("Done!");

async function downloadAsHTML(url: string) {
    const id = url.split("/").at(-1);

    try {
        await Deno.lstat(`./files/${id}.html`);
    } catch (_) {
        await fetch(url, { headers });

        const response = await fetch("https://zlatyfond.sme.sk/download/html", { headers });
        
        const buffer = await response.arrayBuffer();
    
        const textUTF8 = new TextDecoder("utf8").decode(buffer);
        const encoding = textUTF8.match(/(?<=charset=)[^"]+(?=")/)![0].toLowerCase();
    
        const html = new TextDecoder(encoding).decode(buffer);
    
        const dom = new DOMParser().parseFromString(html, "text/html");

        dom.querySelectorAll("#spodok, #hlavicka, .toc, .book > .titlepage, .bibliography, meta[name=generator], .mediaobject").forEach(element => element.remove());
        dom.querySelector("meta[http-equiv='Content-Type']")?.setAttribute("content", "text/html; charset=utf-8");

        [...dom.body.attributes].forEach(attr => dom.body.removeAttribute(attr.name));
        dom.body.innerHTML = dom.querySelector("div")!.innerHTML.replace(/<p>\s*<\/p>/g, "");

        dom.querySelectorAll(".chapter").forEach(element => {
            element.removeAttribute("lang");

            if(element.querySelector(".titlepage")) element.querySelector(".titlepage")!.outerHTML = `<h1>${element.querySelector(".titlepage")!.textContent}</h1>`;
        })

        dom.querySelector("style")!.textContent = `
    body {
        font-family: Georgia, "Times New Roman", Times, serif;
    }

    .chapter {
        line-height: 1.7em;
        margin-bottom: 50px;
    }

    h1 {
        color: navy;
    }
`
        dom.querySelectorAll(".emphasis").forEach(element => {
            element.outerHTML = `<em>${element.textContent}</em>`;
        })

        dom.querySelectorAll(".bold").forEach(element => {
            element.outerHTML = `<strong>${element.textContent}</strong>`;
        })

        dom.querySelectorAll(".literallayout").forEach(element => {
            element.removeAttribute("class");
        })

        Deno.writeTextFileSync(`./files/${id}.html`, dom.documentElement!.outerHTML);
    }
}

async function generateMainPage() {
    const response = await fetch("https://zlatyfond.sme.sk/diela", { headers });
    headers.Cookie = response.headers.get("Set-Cookie")!;
    const html = await response.text();

    const dom = new DOMParser().parseFromString(html, "text/html");
    const pageDom  = new DOMParser().parseFromString("<html><head><meta charset='utf-8'></head><body><main><ul></ul></main><br><br><footer>Všetky diela sú zo <a href='https://zlatyfond.sme.sk/'>Zlatého fondu SME</a> a sú dostupné pod licenciou Creative Commons Attribution-NonCommercial-NoDerivs 2.5 License. Viac informácií na <a href='https://zlatyfond.sme.sk/dokument/autorske-prava'>zlatyfond.sme.sk/dokument/autorske-prava</a>. Zoznam digitalizátorov je dostupný na <a href='https://zlatyfond.sme.sk/digitalizatori'>zlatyfond.sme.sk/digitalizatori</a>.</footer></body></html>", "text/html");

    dom.querySelectorAll("#tu-budu-spisovatelia span:not([id])").forEach(element => {
        const a = element.querySelector("a")!;

        list.push(`https://zlatyfond.sme.sk/${a.getAttribute("href")}`);

        const author = (element.lastChild as Text).textContent.trim();
        const isAnonymous = author.toLowerCase().includes("anonym") || author.toLowerCase().includes("neznámy");

        const li = pageDom.createElement("li");
        li.innerHTML = `<a href="${a.getAttribute("href")!.split("/").at(-1)}.html">${a.textContent}</a>${!isAnonymous ? ` - ${author}` : ""}`;
        pageDom.querySelector("main")!.querySelector("ul")!.appendChild(li);
    })

    Deno.writeTextFileSync("./files/index.html", pageDom.documentElement!.outerHTML);
}

async function removeFailed() {
    const html = await Deno.readTextFile("./files/index.html");

    const dom = new DOMParser().parseFromString(html, "text/html");

    dom.querySelectorAll("li").forEach(element => {
        const url = `./files/${element.querySelector("a")!.getAttribute("href")}`;
        try {
            Deno.lstatSync(url);
        } catch (_) {
            element.remove();
        }
    })

    Deno.writeTextFileSync("./files/index.html", dom.documentElement!.outerHTML);
}