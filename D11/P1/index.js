const fs = require("fs");
const readline = require("readline");
const _ = require("lodash");

if (process.argv.length != 4) {
  console.error("Usage: node index.js [filename] [rounds]");
  return;
}

const file = process.argv[2];
const rounds = process.argv[3];

async function read() {
  const fileStream = fs.createReadStream(`${__dirname}/${file}`);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  var monkeys = [];
  let monkeyIdx = 0;
  for await (const line of rl) {
    var trimmed = _.trim(line);
    if (_.startsWith(trimmed, "Monkey")) {
      monkeys.push({
        id: monkeyIdx,
        count: 0,
      });
    } else if (_.startsWith(trimmed, "Starting items: ")) {
      const items = trimmed
        .substring(16)
        .split(", ")
        .map((str) => parseInt(str));
      monkeys[monkeyIdx].items = items;
    } else if (_.startsWith(trimmed, "Operation: new = old ")) {
      const split = trimmed.substring(21).split(" ");
      const op = split[0] == "*" ? _.multiply : _.add;
      const num = parseInt(split[1]);
      const operation = !num ? (x) => x * x : _.partial(op, num);
      monkeys[monkeyIdx].operation = operation;
    } else if (_.startsWith(trimmed, "Test: divisible by ")) {
      const factor = parseInt(trimmed.substring(19));
      monkeys[monkeyIdx].test = { factor };
    } else if (_.startsWith(trimmed, "If true: throw to monkey ")) {
      const monkeyTrue = parseInt(trimmed.substring(25));
      monkeys[monkeyIdx].test.monkeyTrue = monkeyTrue;
    } else if (_.startsWith(trimmed, "If false: throw to monkey ")) {
      const monkeyFalse = parseInt(trimmed.substring(26));
      monkeys[monkeyIdx].test.monkeyFalse = monkeyFalse;
    } else if (trimmed === "") {
      monkeyIdx += 1;
    }
  }

  return monkeys;
}

function calculateMonkeyBusiness(monkeys) {
  for (var round = 0; round < rounds; round++) {
    for (var monkey of monkeys) {
      monkey.items.forEach((item) => {
        const worryLvl = monkey.operation(item);
        const boredLvl = parseInt(worryLvl / 3);
        const { factor, monkeyTrue, monkeyFalse } = monkey.test;
        const divise = boredLvl % factor;
        const throwTo = !divise ? monkeyTrue : monkeyFalse;
        monkeys[throwTo].items.push(boredLvl);
        monkeys[monkey.id].count += 1;
      });
      monkey.items.splice(0, monkey.items.length);
    }
  }

  var sorted = monkeys.sort(({ count: a }, { count: b }) => b - a);
  var first = sorted.shift().count;
  var second = sorted.shift().count;
  console.log(first * second);
}

read().then(calculateMonkeyBusiness);
