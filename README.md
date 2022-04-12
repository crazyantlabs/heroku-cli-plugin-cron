<a href="https://crontogo.com/"><img alt="Cron To Go logo" src="https://crontogo.com/images/logo.svg" height="80" /></a>

_Cron To Go Scheduler: Run scheduled tasks on your Heroku Apps_

*Cron To Go allows you to schedule virtually any job on your Heroku applications.*

heroku-cli-plugin-cron
==========================

Heroku CLI plugin for [Cron To Go Scheduler Heroku add-on](https://elements.heroku.com/addons/crontogo)

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/heroku-cron.svg)](https://npmjs.org/package/heroku-cron)
[![Build](https://github.com/crazyantlabs/heroku-cli-plugin-cron/actions/workflows/node.yml/badge.svg)](https://github.com/crazyantlabs/heroku-cli-plugin-cron/actions/workflows/node.yml)
[![Downloads/week](https://img.shields.io/npm/dw/heroku-cron.svg)](https://npmjs.org/package/heroku-cron)
[![License](https://img.shields.io/npm/l/heroku-cron.svg)](https://github.com/crazyantlabs/heroku-cli-plugin-cron/blob/main/package.json)

You can read more about Cron To Go Scheduler on [Dev Center](https://devcenter.heroku.com/articles/crontogo).

<!-- toc -->
* [Installation](#installation)
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Installation
<!-- installation -->
```sh-session
$ heroku plugins:install heroku-cron
```
<!-- installationstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g heroku-cron
$ heroku COMMAND
running command...
$ heroku (--version|-v)
heroku-cron/1.0.2 darwin-x64 node-v14.16.0
$ heroku --help [COMMAND]
USAGE
  $ heroku COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->

<!-- commandsstop -->
* [`heroku cron`](#heroku-cron)
* [`heroku cron:jobs`](#heroku-cronjobs)
* [`heroku cron:jobs:clear`](#heroku-cronjobsclear)
* [`heroku cron:jobs:create`](#heroku-cronjobscreate)
* [`heroku cron:jobs:delete JOB`](#heroku-cronjobsdelete-job)
* [`heroku cron:jobs:import FILENAME`](#heroku-cronjobsimport-filename)
* [`heroku cron:jobs:info JOB`](#heroku-cronjobsinfo-job)
* [`heroku cron:jobs:logs JOB`](#heroku-cronjobslogs-job)
* [`heroku cron:jobs:pause JOB`](#heroku-cronjobspause-job)
* [`heroku cron:jobs:resume JOB`](#heroku-cronjobsresume-job)
* [`heroku cron:jobs:run JOB`](#heroku-cronjobsrun-job)
* [`heroku cron:jobs:trigger JOB`](#heroku-cronjobstrigger-job)
* [`heroku cron:jobs:update JOB`](#heroku-cronjobsupdate-job)

## `heroku cron`

get information about Cron To Go

```
USAGE
  $ heroku cron -a <value> [-r <value>] [--json]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use
  --json                return the results as JSON

DESCRIPTION
  get information about Cron To Go

  Read more about this feature at https://devcenter.heroku.com/articles/crontogo

EXAMPLES
  $ heroku cron -a your-app

  $ heroku cron --app your-app --json
```

_See code: [src/commands/cron/index.ts](https://github.com/crazyantlabs/heroku-cli-plugin-cron/blob/v1.0.1/src/commands/cron/index.ts)_

## `heroku cron:jobs`

list jobs on Cron To Go

```
USAGE
  $ heroku cron:jobs -a <value> [-r <value>] [--json] [--columns <value>] [-x] [--no-header | [--csv |
    --no-truncate]]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use
  -x, --extended        show extra columns
  --columns=<value>     only show provided columns (comma-seperated)
  --csv                 output is csv format
  --json                return the results as JSON
  --no-header           hide table header from output
  --no-truncate         do not truncate output to fit screen

DESCRIPTION
  list jobs on Cron To Go

  Read more about this feature at https://devcenter.heroku.com/articles/crontogo

EXAMPLES
  $ heroku cron:jobs -a your-app

  $ heroku cron:jobs --app your-app --json

  $ heroku cron:jobs --app=your-app --csv
```

_See code: [src/commands/cron/jobs/index.ts](https://github.com/crazyantlabs/heroku-cli-plugin-cron/blob/v1.0.1/src/commands/cron/jobs/index.ts)_

## `heroku cron:jobs:clear`

delete all jobs on Cron To Go

```
USAGE
  $ heroku cron:jobs:clear -a <value> [-r <value>] [--confirm <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use
  --confirm=<value>     confirms deleting all jobs if passed in

DESCRIPTION
  delete all jobs on Cron To Go

  Read more about this feature at https://devcenter.heroku.com/articles/crontogo

EXAMPLES
  $ heroku cron:jobs:clear -a your-app

  $ heroku cron:jobs:clear --app your-app

  $ heroku cron:jobs:clear --app your-app --confirm your-app
```

_See code: [src/commands/cron/jobs/clear.ts](https://github.com/crazyantlabs/heroku-cli-plugin-cron/blob/v1.0.1/src/commands/cron/jobs/clear.ts)_

## `heroku cron:jobs:create`

create a job on Cron To Go

```
USAGE
  $ heroku cron:jobs:create -a <value> [-r <value>] [--json] [--nickname <value>] [--schedule <value>] [--timezone
    <value>] [--command <value>] [--dyno
    Free|Hobby|Standard-1X|Standartd-2X|Performance-M|Performance-L|Private-S|Private-M|Private-L] [--timeout <value>]
    [--state enabled|paused]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use
  --command=<value>     command to run as a one-off dyno either as the command to execute, or a process type that is
                        present in your apps's Procfile
  --dyno=<option>       size of the one-off dyno
                        <options:
                        Free|Hobby|Standard-1X|Standartd-2X|Performance-M|Performance-L|Private-S|Private-M|Private-L>
  --json                return the results as JSON
  --nickname=<value>    nickname of the job. Leave blank to use the job command
  --schedule=<value>    schedule of the job specified using unix-cron format. The minimum precision is 1 minute
  --state=<option>      state of the job
                        <options: enabled|paused>
  --timeout=<value>     number of seconds until the one-off dyno expires, after which it will soon be killed
  --timezone=<value>    time zone of the job. UTC time zone is recommended for avoiding daylight savings time issues

DESCRIPTION
  create a job on Cron To Go

  Read more about this feature at https://devcenter.heroku.com/articles/crontogo

EXAMPLES
  $ heroku cron:jobs:create -a your-app

  $ heroku cron:jobs:create --app your-app
```

_See code: [src/commands/cron/jobs/create.ts](https://github.com/crazyantlabs/heroku-cli-plugin-cron/blob/v1.0.1/src/commands/cron/jobs/create.ts)_

## `heroku cron:jobs:delete JOB`

delete job on Cron To Go

```
USAGE
  $ heroku cron:jobs:delete [JOB] -a <value> [-r <value>] [--confirm <value>]

ARGUMENTS
  JOB  unique ID of the job

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use
  --confirm=<value>     confirms deleting the job if passed in

DESCRIPTION
  delete job on Cron To Go

  Read more about this feature at https://devcenter.heroku.com/articles/crontogo

EXAMPLES
  $ heroku cron:jobs:delete 01234567-89ab-cdef-0123-456789abcdef -a your-app

  $ heroku cron:jobs:delete 01234567-89ab-cdef-0123-456789abcdef --app your-app

  $ heroku cron:jobs:delete 01234567-89ab-cdef-0123-456789abcdef --app your-app --confirm 01234567-89ab-cdef-0123-456789abcdef
```

_See code: [src/commands/cron/jobs/delete.ts](https://github.com/crazyantlabs/heroku-cli-plugin-cron/blob/v1.0.1/src/commands/cron/jobs/delete.ts)_

## `heroku cron:jobs:import FILENAME`

import jobs into Cron To Go

```
USAGE
  $ heroku cron:jobs:import [FILENAME] -a <value> [-r <value>] [--delete] [--confirm <value>]

ARGUMENTS
  FILENAME  manifest filename

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use
  --confirm=<value>     confirms deleting all jobs prior to applying manifest file if passed in
  --delete              delete all jobs prior to applying manifest file

DESCRIPTION
  import jobs into Cron To Go

  Read more about this feature at https://devcenter.heroku.com/articles/crontogo

EXAMPLES
  $ heroku cron:jobs:import -a your-app

  $ heroku cron:jobs:import --app your-app

  $ heroku cron:jobs:import --app your-app --delete

  $ heroku cron:jobs:import --app your-app --delete --confirm your-app
```

_See code: [src/commands/cron/jobs/import.ts](https://github.com/crazyantlabs/heroku-cli-plugin-cron/blob/v1.0.1/src/commands/cron/jobs/import.ts)_

## `heroku cron:jobs:info JOB`

get information about a job on Cron To Go

```
USAGE
  $ heroku cron:jobs:info [JOB] -a <value> [-r <value>] [--json]

ARGUMENTS
  JOB  unique ID of the job

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use
  --json                return the results as JSON

DESCRIPTION
  get information about a job on Cron To Go

  Read more about this feature at https://devcenter.heroku.com/articles/crontogo

EXAMPLES
  $ heroku cron:jobs:info 01234567-89ab-cdef-0123-456789abcdef -a your-app

  $ heroku cron:jobs:info 01234567-89ab-cdef-0123-456789abcdef --app your-app --json
```

_See code: [src/commands/cron/jobs/info.ts](https://github.com/crazyantlabs/heroku-cli-plugin-cron/blob/v1.0.1/src/commands/cron/jobs/info.ts)_

## `heroku cron:jobs:logs JOB`

display job recent log output on Cron To Go

```
USAGE
  $ heroku cron:jobs:logs [JOB] -a <value> [-r <value>] [-e <value>] [-n <value>] [-t] [--force-colors]

ARGUMENTS
  JOB  unique ID of the job

FLAGS
  -a, --app=<value>        (required) app to run command against
  -e, --execution=<value>  only show output from this job execution
  -n, --num=<value>        [default: 100] number of lines to display
  -r, --remote=<value>     git remote of app to use
  -t, --tail               continually stream logs
  --force-colors           force use of colors (even on non-tty output)

DESCRIPTION
  display job recent log output on Cron To Go

  Read more about this feature at https://devcenter.heroku.com/articles/crontogo

EXAMPLES
  $ heroku cron:jobs:logs 01234567-89ab-cdef-0123-456789abcdef -a your-app

  $ heroku cron:jobs:logs 01234567-89ab-cdef-0123-456789abcdef -a your-app --num 100

  $ heroku cron:jobs:logs 01234567-89ab-cdef-0123-456789abcdef --app your-app --tail
```

_See code: [src/commands/cron/jobs/logs.ts](https://github.com/crazyantlabs/heroku-cli-plugin-cron/blob/v1.0.1/src/commands/cron/jobs/logs.ts)_

## `heroku cron:jobs:pause JOB`

pause job on Cron To Go

```
USAGE
  $ heroku cron:jobs:pause [JOB] -a <value> [-r <value>]

ARGUMENTS
  JOB  unique ID of the job

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  pause job on Cron To Go

  Read more about this feature at https://devcenter.heroku.com/articles/crontogo

EXAMPLES
  $ heroku cron:jobs:pause 01234567-89ab-cdef-0123-456789abcdef -a your-app

  $ heroku cron:jobs:pause 01234567-89ab-cdef-0123-456789abcdef --app your-app
```

_See code: [src/commands/cron/jobs/pause.ts](https://github.com/crazyantlabs/heroku-cli-plugin-cron/blob/v1.0.1/src/commands/cron/jobs/pause.ts)_

## `heroku cron:jobs:resume JOB`

resume job on Cron To Go

```
USAGE
  $ heroku cron:jobs:resume [JOB] -a <value> [-r <value>]

ARGUMENTS
  JOB  unique ID of the job

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  resume job on Cron To Go

  Read more about this feature at https://devcenter.heroku.com/articles/crontogo

EXAMPLES
  $ heroku cron:jobs:resume 01234567-89ab-cdef-0123-456789abcdef -a your-app

  $ heroku cron:jobs:resume 01234567-89ab-cdef-0123-456789abcdef --app your-app
```

_See code: [src/commands/cron/jobs/resume.ts](https://github.com/crazyantlabs/heroku-cli-plugin-cron/blob/v1.0.1/src/commands/cron/jobs/resume.ts)_

## `heroku cron:jobs:run JOB`

trigger job execution on Cron To Go

```
USAGE
  $ heroku cron:jobs:run [JOB] -a <value> [-r <value>] [--json] [-t] [--confirm <value>]

ARGUMENTS
  JOB  unique ID of the job

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use
  -t, --tail            continually stream job logs
  --confirm=<value>     confirms running the job if passed in
  --json                return the results as JSON

DESCRIPTION
  trigger job execution on Cron To Go

  Read more about this feature at https://devcenter.heroku.com/articles/crontogo

ALIASES
  $ heroku cron:jobs:trigger

EXAMPLES
  $ heroku cron:jobs:run 01234567-89ab-cdef-0123-456789abcdef -a your-app

  $ heroku cron:jobs:run 01234567-89ab-cdef-0123-456789abcdef -a your-app --json

  $ heroku cron:jobs:run 01234567-89ab-cdef-0123-456789abcdef --app your-app

  $ heroku cron:jobs:run 01234567-89ab-cdef-0123-456789abcdef --app your-app --tail

  $ heroku cron:jobs:run 01234567-89ab-cdef-0123-456789abcdef --app your-app --tail --confirm 01234567-89ab-cdef-0123-456789abcdef
```

_See code: [src/commands/cron/jobs/run.ts](https://github.com/crazyantlabs/heroku-cli-plugin-cron/blob/v1.0.1/src/commands/cron/jobs/run.ts)_

## `heroku cron:jobs:trigger JOB`

trigger job execution on Cron To Go

```
USAGE
  $ heroku cron:jobs:trigger [JOB] -a <value> [-r <value>] [--json] [-t] [--confirm <value>]

ARGUMENTS
  JOB  unique ID of the job

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use
  -t, --tail            continually stream job logs
  --confirm=<value>     confirms running the job if passed in
  --json                return the results as JSON

DESCRIPTION
  trigger job execution on Cron To Go

  Read more about this feature at https://devcenter.heroku.com/articles/crontogo

ALIASES
  $ heroku cron:jobs:trigger

EXAMPLES
  $ heroku cron:jobs:run 01234567-89ab-cdef-0123-456789abcdef -a your-app

  $ heroku cron:jobs:run 01234567-89ab-cdef-0123-456789abcdef -a your-app --json

  $ heroku cron:jobs:run 01234567-89ab-cdef-0123-456789abcdef --app your-app

  $ heroku cron:jobs:run 01234567-89ab-cdef-0123-456789abcdef --app your-app --tail

  $ heroku cron:jobs:run 01234567-89ab-cdef-0123-456789abcdef --app your-app --tail --confirm 01234567-89ab-cdef-0123-456789abcdef
```

## `heroku cron:jobs:update JOB`

update a job on Cron To Go

```
USAGE
  $ heroku cron:jobs:update [JOB] -a <value> [-r <value>] [--json] [--nickname <value>] [--schedule <value>]
    [--timezone <value>] [--command <value>] [--dyno
    Free|Hobby|Standard-1X|Standartd-2X|Performance-M|Performance-L|Private-S|Private-M|Private-L] [--timeout <value>]
    [--state enabled|paused]

ARGUMENTS
  JOB  unique ID of the job

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use
  --command=<value>     command to run as a one-off dyno either as the command to execute, or a process type that is
                        present in your apps's Procfile
  --dyno=<option>       size of the one-off dyno
                        <options:
                        Free|Hobby|Standard-1X|Standartd-2X|Performance-M|Performance-L|Private-S|Private-M|Private-L>
  --json                return the results as JSON
  --nickname=<value>    nickname of the job. Leave blank to use the job command
  --schedule=<value>    schedule of the job specified using unix-cron format. The minimum precision is 1 minute
  --state=<option>      state of the job
                        <options: enabled|paused>
  --timeout=<value>     number of seconds until the one-off dyno expires, after which it will soon be killed
  --timezone=<value>    time zone of the job. UTC time zone is recommended for avoiding daylight savings time issues

DESCRIPTION
  update a job on Cron To Go

  Read more about this feature at https://devcenter.heroku.com/articles/crontogo

EXAMPLES
  $ heroku cron:jobs:create -a your-app

  $ heroku cron:jobs:create --app your-app
```

_See code: [src/commands/cron/jobs/update.ts](https://github.com/crazyantlabs/heroku-cli-plugin-cron/blob/v1.0.1/src/commands/cron/jobs/update.ts)_
