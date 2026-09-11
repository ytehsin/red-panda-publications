import { promises as fs } from "fs";
import path from "path";
import { buildSimpleEpub } from "../src/lib/build-epub";

const books = [
  {
    file: "the-migration-clock.epub",
    title: "The Migration Clock",
    author: "Lina Voss",
    chapters: [
      {
        title: "The hour the flock turned",
        paragraphs: [
          "Mira kept the clock in the kitchen window, the one that faced the cream terrace where the pigeons practised their landings. It was not a useful clock. It lost three minutes whenever the fog came in, and gained them back when the terracotta roofs dried.",
          "Her mother said a publishing house ran the same way: you thought you were keeping time, and then a manuscript arrived late and still knew the way home.",
          "On the morning the flock turned inland, Mira packed a satchel with proofs, a pencil, and a sandwich wrapped in paper that still smelled of the press.",
        ],
      },
      {
        title: "Pigeon Lane",
        paragraphs: [
          "The office on Pigeon Lane had a brass slot for unsolicited pages and a bowl of water for the birds that insisted on the sill. Nobody had the heart to shoo them.",
          "Red Panda Publications printed on bright stock. The editors believed a dark room was for photographs, not for sentences.",
        ],
      },
    ],
  },
  {
    file: "pigeon-post.epub",
    title: "Pigeon Post",
    author: "Amina Reed",
    chapters: [
      {
        title: "A letter with coral feet",
        paragraphs: [
          "Theo wrote to his cousin every Thursday and tied the note with baker’s twine. The pigeon, who was called Stamp, knew the route better than the post office.",
          "One week the letter was only a drawing of a red panda reading on a roof. Stamp delivered it anyway.",
        ],
      },
    ],
  },
  {
    file: "terracotta-sky.epub",
    title: "Terracotta Sky",
    author: "Noor Ellison",
    chapters: [
      {
        title: "Poems",
        paragraphs: [
          "Iridescence is not a trick of the neck. It is the sky agreeing to be seen.",
          "We keep cream paper so the poem has somewhere bright to land.",
        ],
      },
    ],
  },
  {
    file: "river-of-paper.epub",
    title: "River of Paper",
    author: "Haruto Bell",
    chapters: [
      {
        title: "Mill",
        paragraphs: [
          "Before a book is a book it is water, rag, and patience. The mill does not hurry, and neither should the editor.",
          "This sample chapter is here so the house reader has something to hold. The printed edition runs to four hundred pages.",
        ],
      },
    ],
  },
  {
    file: "ink-and-feather.epub",
    title: "Ink & Feather",
    author: "S. P. Marlowe",
    chapters: [
      {
        title: "On sending work out",
        paragraphs: [
          "Courage, in this house, looks like a stamped envelope and a night of not refreshing the inbox.",
          "Revise until the sentence can fly in a straight line. Then let it go.",
        ],
      },
    ],
  },
  {
    file: "the-house-of-stories.epub",
    title: "The House of Stories",
    author: "Clara Pigeon",
    chapters: [
      {
        title: "The front desk still answers",
        paragraphs: [
          "Someone had to pick up. The novel begins with a ringing phone and a stack of unmarked galleys.",
          "By evening the lights in the bindery were still on, cream and terracotta, like a pigeon’s chest in last sun.",
        ],
      },
    ],
  },
];

async function main() {
  const dir = path.join(process.cwd(), "public/epubs");
  await fs.mkdir(dir, { recursive: true });
  for (const book of books) {
    const buf = await buildSimpleEpub(book);
    await fs.writeFile(path.join(dir, book.file), buf);
    console.log("wrote", book.file, buf.length, "bytes");
  }
}

main();
