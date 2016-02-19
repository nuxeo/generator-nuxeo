# Yeoman generator for Nuxeo
# Introduction
`generator-nuxeo` provides Nuxeo components scaffolding using [Yeoman](http://yeoman.io) (a scaffolding tool for the web). It lets you easily scaffold common Nuxeo components like empty project, Nuxeo Package, Automation Operation, Nuxeo Service ... This saves you time writting boilerplate code to focus on your code instead of the structure.

# Features
- Each feature are version dependents
- Empty bundle creation
- Empty bundle creation with Maven multi module support
- Automation Operation with his test
- Nuxeo Package (Marketplace)
- Nuxeo Service
- Nuxeo Event Listener

## Incoming Features
- Polymer based application
- Functional Testing module
- REST endpoint / content enricher
- Scheduler / Worker
- ...

# Installation
**The node.js module is not yet available as a global module. You should only test it locally.**

First, install [Yeoman](http://yeoman.io) and generator-nuxeo using [npm](https://www.npmjs.com/) (we assume you have pre-installed [node.js](https://nodejs.org/)).

```bash
npm install -g yo
npm install -g generator-nuxeo
```

# Test the generator
To test the generator directly from the sources; you need to:

```bash
git clone https://github.com/nuxeo/generator-nuxeo
npm link
```

It will install dependencies and symlink the module to your local registry. After that, you can use the generator as described below.

# Generators
You can create several modules at once like:

```
yo nuxeo operation package
```

## Command Parameters
- `--nuxeo='master'`: Specify which branch you want; in case some scaffolding changed
- `--localPath='/my/own/path'`: Path to your local clone of `https://github.com/nuxeo/generator-nuxeo-meta`
- `--nologo='true'`: Disable big welcome message

## Single module
Sets up an empty Nuxeo Bundle.

```
yo nuxeo
# or
yo nuxeo single-module
```

## Multi module
Sets up an empty Nuxeo Bundle using Maven multi module support.

```
yo nuxeo multi-module
```

## Operation
Sets up an empty Operation with his test class.

```
yo nuxeo operation
```

## Nuxeo Package
Create a module to handle a Nuxeo Package of your project

```
yo nuxeo package
```

# Licensing
[Apache License, Version 2.0](http://www.apache.org/licenses/LICENSE-2.0)

# About Nuxeo
Nuxeo dramatically improves how content-based applications are built, managed and deployed, making customers more agile, innovative and successful. Nuxeo provides a next generation, enterprise ready platform for building traditional and cutting-edge content oriented applications. Combining a powerful application development environment with SaaS-based tools and a modular architecture, the Nuxeo Platform and Products provide clear business value to some of the most recognizable brands including Verizon, Electronic Arts, Netflix, Sharp, FICO, the U.S. Navy, and Boeing. Nuxeo is headquartered in New York and Paris. More information is available at [www.nuxeo.com](http://www.nuxeo.com).
