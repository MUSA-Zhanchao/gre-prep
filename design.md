# GRE Vocabulary Loop

Build a very simple local web app using the provided GRE vocabulary JSON file.

## Core Flow

1. Randomly choose a starting word.
2. Show one English word.
3. Show an input box below it.
4. The user types the meaning they remember.
5. The user must enter something before continuing.
6. After submission, display:
   - Standard meaning
   - Synonyms
   - Example sentence
7. Show two buttons:
   - `True`
   - `False`

## Review Logic

### True

- Treat the word as remembered.
- Move it to the end of the current review loop.
- It will appear again only after the other words in the loop have been reviewed.

### False

- Treat the word as forgotten.
- Insert it back into the queue approximately 10 words later.
- If fewer than 10 words remain, place it near the end of the queue.

## Randomization

- Do not always begin with the first word in the JSON file.
- Shuffle the vocabulary list when a new session starts.
- Save the current queue and position in `localStorage`.
- When the page is reopened, continue from the previous position rather than restarting.
- Add a `Reset and Reshuffle` button.

## Interface

Before submission:

```text
equivocal

[ Type the meaning here ]

[ Submit ]