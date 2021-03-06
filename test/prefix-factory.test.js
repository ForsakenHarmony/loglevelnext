const test = require('ava');
const sinon = require('sinon');

const LogLevel = require('../lib/LogLevel');
const PrefixFactory = require('../lib/factory/PrefixFactory');

const sandbox = sinon.createSandbox();

let log;
let factory;

test.before(() => {
  sandbox.spy(console, 'info');
  log = new LogLevel({
    level: 'trace',
    name: 'test',
    prefix: {}
  });
    factory = log.factory; // eslint-disable-line
});

test.afterEach(() => {
  console.info.resetHistory();
});

test.after(() => {
  sandbox.restore();
});

test('created a PrefixFactory', (t) => {
  t.truthy(factory instanceof PrefixFactory);
});

test('gets the name from the base logger', (t) => {
  t.is(factory.options.name({ logger: log }), 'test');
});

test.serial('prefixes output', (t) => {
  log.info('foo');

  const [first] = console.info.firstCall.args;

  t.is(console.info.callCount, 1);
  t.truthy(/\d{2}:\d{2}:\d{2}\s\[info\]\sfoo/.test(first));
});

test.serial('prefixes output with custom options', (t) => {
  const options = {
    level: (opts) => `[${opts.level.substring(1)}]`,
    name: (opts) => opts.logger.name.toUpperCase(),
    template: '{{time}} {{level}} ({{name}}) {{nope}}-',
    time: () =>
      `[${
        new Date()
          .toTimeString()
          .split(' ')[0]
          .split(':')[0]
      }]`
  };
  const customPrefix = new PrefixFactory(log, options);

  log.factory = customPrefix;
  log.info('foo');

  const [first] = console.info.firstCall.args;
  const terped = customPrefix.interpolate('info');
  const rOutput = /\[\d{2}\]\s\[nfo\]\s\(TEST\)\s\{\{nope\}\}-/;

  t.truthy(rOutput.test(terped));
  t.is(console.info.callCount, 1);
  t.truthy(/\[\d{2}\]\s\[nfo\]\s\(TEST\)\s\{\{nope\}\}-foo/.test(first));

  // test the first argument when passing a non-string
  log.info({});

  const [last] = console.info.lastCall.args;
  t.truthy(rOutput.test(last));
});

test.serial('supports different prefixes per logger', (t) => {
  const log2 = new LogLevel({
    level: 'trace',
    name: 'test',
    prefix: { template: 'baz ' }
  });

  log.info('foo');
  log2.info('foo');

  const [first] = console.info.firstCall.args;
  const [last] = console.info.lastCall.args;

  t.is(console.info.callCount, 2);
  t.not(first, last);
});
