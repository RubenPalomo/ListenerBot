const fs = require("fs");
const TelegramBot = require("node-telegram-bot-api");
const token = "YOUR-TOKEN";
const bot = new TelegramBot(token, { polling: true });
// Array with all the interesting topics for us to filter in the conversation
const interestingTopics = ["croqueta", "unicornio"];

/*
 *
 *   *   *   FUNCTIONS    *   *   *
 *
 */

// Function to delete a file
const deleteFile = (fileName) => fs.unlinkSync(fileName);

// Function to delete files from the current group
const deleteFilesFromGroup = (fileName) => {
  if (fs.existsSync(`./${fileName}.txt`)) deleteFile(`./${fileName}.txt`);
  if (fs.existsSync(`./${fileName}_interesting.txt`))
    deleteFile(`./${fileName}_interesting.txt`);
};

// Function to store a string to a file (or create it if doesn't exist)
const write = (fileName, text) =>
  fs.appendFile(fileName, text, (err) => {
    if (err) console.log(err);
  });

// Function to store conversation items from the current group
const printData = (msg) => {
  const today = new Date();
  const fileName = msg.chat.title;
  const text = `Date: ${today}\n@${msg.from.username}: ${msg.text}\n\n`;

  // One of then to store the whole conversation
  write(`${fileName}.txt`, text);

  // And the other to store elements of the conversation that contain words of interest to us
  interestingTopics.forEach((topic) => {
    if (msg.text.toLowerCase().includes(topic))
      write(`${fileName}_interesting.txt`, text);
  });
};

// Function to read a file
const readFile = (fileName) => fs.readFileSync(fileName);

// Function to read the file with the whole conversation
const readConversation = (msg) => {
  if (fs.existsSync(`./${msg.chat.title}.txt`))
    bot.sendMessage(msg.chat.id, readFile(`./${msg.chat.title}.txt`));
  else bot.sendMessage(msg.chat.id, "No data.");
};

// Function to read the file with the interesting elements of the group
const readInterestingItems = (msg) => {
  if (fs.existsSync(`./${msg.chat.title}_interesting.txt`))
    bot.sendMessage(
      msg.chat.id,
      readFile(`./${msg.chat.title}_interesting.txt`)
    );
  else bot.sendMessage(msg.chat.id, "No data.");
};

/*
 *
 *   *   *   COMMAND LIST    *   *   *
 *
 */

// Listener. It will store all the conversation (if the chat is a group)
bot.on("message", (msg) => {
  if (msg.chat.type !== "private" && msg.text !== undefined) printData(msg);
});

// Command to send all the store conversation to the chat
bot.onText(/^\/getConversationHistory/, (msg) => {
  // If the chat is not a group it won't do nothing
  if (msg.chat.type === "private") return;

  bot.getChatMember(msg.chat.id, msg.from.id).then((response) => {
    // If the user using the command is not an admin or creator it will not work
    if (response.status !== "member") readConversation(msg);
    else
      bot.sendMessage(
        msg.chat.id,
        "You do not have permission to perform the action"
      );
  });
});

// Command to send all the interesting items on the conversation
bot.onText(/^\/getInterestingItems/, (msg) => {
  // If the chat is not a group it won't do nothing
  if (msg.chat.type === "private") return;

  bot.getChatMember(msg.chat.id, msg.from.id).then((response) => {
    // If the user using the command is not an admin or creator it will not work
    if (response.status !== "member") readInterestingItems(msg);
    else
      bot.sendMessage(
        msg.chat.id,
        "You do not have permission to perform the action"
      );
  });
});

// Reset comand. It will delete all files created by the current group.
bot.onText(/^\/reset/, (msg) => {
  // If the chat is not a group it won't do nothing
  if (msg.chat.type === "private") return;
  bot
    .getChatMember(msg.chat.id, msg.from.id)
    .then((response) => {
      // If the user using the command is not an admin or creator it will not work
      if (response.status !== "member") {
        deleteFilesFromGroup(msg.chat.title);
        bot.sendMessage(
          msg.chat.id,
          `${msg.chat.title} group data has been deleted!`
        );
      } else
        bot.sendMessage(
          msg.chat.id,
          "You do not have permission to perform the action"
        );
    })
    .catch((error) => bot.sendMessage(msg.chat.id, error));
});

// Command for tests
bot.onText(/^\/test/, (msg) => {});
