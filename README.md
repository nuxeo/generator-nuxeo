# Yeoman generator for Nuxeo
[![Build Status](https://qa.nuxeo.org/jenkins/buildStatus/icon?job=tools_generator-nuxeo-master)](https://qa.nuxeo.org/jenkins/job/tools_generator-nuxeo-master/)

# Introduction
`generator-nuxeo` provides Nuxeo components scaffolding using [Yeoman](http://yeoman.io) (a scaffolding tool for the web). It lets you easily scaffold common Nuxeo components like empty projects, Nuxeo Packages, Automation Operations, Nuxeo Services... This saves you time writing boilerplate code to focus on your code instead of the structure.

Each generation is coming with a dedicated test; for instance the Operation generator adds an Operation with some basic codes showing you how to inject context objects, how to specify a parameter and a sample test class to validate its behavior.

# Features
- Each feature is version dependent
- Empty bundle creation
- Empty bundle creation with Maven multi module support
- Automation Operation
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
**generator-nuxeo is not yet available as a global NPM module. You can install it directly from the Github repository.**

**Ensure `npm --version` is at least 2.12.0**

First, install [Yeoman](http://yeoman.io) and generator-nuxeo using [npm](https://www.npmjs.com/) (we assume you have pre-installed [node.js](https://nodejs.org/)).

```bash
npm install -g yo
# Install it from the repository
npm install -g nuxeo/generator-nuxeo
# (not yet available) Install it from the NPM registry
npm install -g generator-nuxeo
```

# Test the generator
To test the generator; you should clone the repository and link it to your local NPM registry:

```bash
git clone https://github.com/nuxeo/generator-nuxeo
cd generator-nuxeo
npm link
```

It will install dependencies and symlink the module to your local registry. After that, you can use the generator as described below.

# Bootstrap an Empty Nuxeo Project
To create a empty Nuxeo Project (based on a Maven multi-module project), **ensure you are in an empty folder**, and execute the following lines:

```bash
$ mkdir my-project
$ cd my-project
$ yo nuxeo
```

# Generators
You can create several modules at once like:

```bash
yo nuxeo operation package
```

## Command Parameters
- `--nuxeo='master'`: Specify which branch you want; in case some scaffolding changed
- `--localPath='/my/own/path'`: Path to your local clone of `https://github.com/nuxeo/generator-nuxeo-meta`
- `--nologo='true'`: Disable big welcome message

## Multi module
Sets up an empty Nuxeo Bundle using Maven multi module support.

```bash
yo nuxeo
or
yo nuxeo multi-module
```

### Parameters:
- Parent Artifact id: It must have inherit from a Nuxeo artifact to ensure dependency management is fine. (default: `nuxeo-distribution`)
- Parent Group id: Parent group Id name (default: `org.nuxeo.ecm.distribution`)
- Parent Version: Parent version (default: `8.2-SNAPSHOT`) (`7.10` Latest LTS, `8.1` latest FT)
- Nuxeo Version: _Asked only if no parent specified_, Nuxeo dependency management is imported. (default: `8.2-SNAPSHOT`) (`7.10` Latest LTS, `8.1` latest FT)
- Project Artifact id: Artifact id, a good practice is to suffix it with `-parent`; as it will be only a `pom` artifact.
- Project group id: Groups id.
- Project version: Project version (default: `1.0-SNAPSHOT`)

### Important Notes
Using a Maven multi module architecture is the recommended way to bootstrap a new project: it allows to generate a Nuxeo Package afterwards to easily deploy your code on a Nuxeo Platform instance. On the other hand, when a project has been generated using a single module architecture, the Nuxeo Package needs to be created manually.

## Single module
Sets up an empty Nuxeo Bundle.

```bash
yo nuxeo single-module
```

### Parameters:
- Parent Artifact id: It must have inherit from a Nuxeo artifact to ensure dependency management is fine. (default: `nuxeo-addons-parent`)
- Parent Group id: Parent group Id name (default: `org.nuxeo`)
- Parent Version: Parent version (default: `8.2-SNAPSHOT`) (`7.10` Latest LTS, `8.1` latest FT)
- Nuxeo Version: _Asked only if no parent specified_, Nuxeo dependency management is imported. (default: `8.2-SNAPSHOT`) (`7.10` Latest LTS, `8.1` latest FT)
- Project Artifact id: Artifact id.
- Project group id: Groups id.
- Project version: Project version (default: `1.0-SNAPSHOT`)

### Important Notes
This option should not be called directly to bootstrap a new project; use the multi-module option instead so that you can generate a Nuxeo Package later on.

## Operation
Adds an empty Nuxeo Automation [Operation](https://doc.nuxeo.com/x/Go0ZAQ) along with a corresponding unit test.

```bash
yo nuxeo operation
```

### Parameters:
- Operation class name: Class name.
- Operation package: Class package.
- Operation label: Label used when you expose your Operation inside Studio.

## Listener
Adds a [listener](https://doc.nuxeo.com/x/C4AO) with its test class, the events will be asked during the generation process. Both existing and custom events can be declared. You can create any listener type: pre-commit, post-commit, synchronous and asynchronous.

```bash
yo nuxeo listener
```

### Parameters:
- Listener class name: Class name.
- Listener package: Class package.
- Trigger on events: List of some common events to bind to your listener.
- Custom Events: _In case you select 'custom events'_ in the previous list; comma separate list of other events.
- Asynchronous Listener: if you need to run after the transaction has committed, in a new transaction and a separate thread. This is useful for any long-running operations whose result doesn't have to be seen immediately in the user interface.
- Post-commit Listener: if you need to run after the transaction has committed, in a new transaction but in the same thread, this is useful for logging.

## Nuxeo Service
Adds a [Nuxeo component](https://doc.nuxeo.com/x/DIAO) exposed as a Nuxeo service.

```bash
yo nuxeo service
```

### Parameters:
- Service interface name: Interface name, a default implemention is created using the common pattern `InterfaceClassImpl`.
- Service package: Interface / Class package.

## Nuxeo Package
Creates a Maven module to handle a [Nuxeo Package](https://doc.nuxeo.com/x/CwIz) generation of your project. **Can only be called in a Maven multi-module architecture**, hence make sure to bootstrap your project using ```yo nuxeo``` or ```yo nuxeo multi-module```. If you used ```yo nuxeo single-module``` to bootstrap your project, you won't be able to call that option afterwards.

```bash
yo nuxeo package
```

### Parameters:
- Parent Artifact id:
- Parent Group id:
- Parent version:
- Package Artifact id:
- Package name:
- Company name:

# Licensing
[Apache License, Version 2.0](http://www.apache.org/licenses/LICENSE-2.0)

# About Nuxeo
Nuxeo dramatically improves how content-based applications are built, managed and deployed, making customers more agile, innovative and successful. Nuxeo provides a next generation, enterprise ready platform for building traditional and cutting-edge content oriented applications. Combining a powerful application development environment with SaaS-based tools and a modular architecture, the Nuxeo Platform and Products provide clear business value to some of the most recognizable brands including Verizon, Electronic Arts, Netflix, Sharp, FICO, the U.S. Navy, and Boeing. Nuxeo is headquartered in New York and Paris. More information is available at [www.nuxeo.com](http://www.nuxeo.com).
