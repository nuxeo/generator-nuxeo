[![Build Status](https://qa.nuxeo.org/jenkins/buildStatus/icon?job=tools_generator-nuxeo-master)](https://qa.nuxeo.org/jenkins/job/tools_generator-nuxeo-master/)
[![npm version](https://img.shields.io/npm/v/generator-nuxeo.svg?style=flat-square)](https://www.npmjs.com/package/generator-nuxeo)
[![npm downloads](https://img.shields.io/npm/dm/generator-nuxeo.svg?style=flat-square)](https://www.npmjs.com/package/generator-nuxeo)
[![Dependency Status](https://img.shields.io/david/nuxeo/generator-nuxeo.svg?style=flat-square)](https://david-dm.org/nuxeo/generator-nuxeo) [![devDependency Status](https://img.shields.io/david/dev/nuxeo/generator-nuxeo.svg?style=flat-square)](https://david-dm.org/nuxeo/generator-nuxeo#info=devDependencies)


# About
**Yeoman Generator for Nuxeo Platform**

The `generator-nuxeo` provides Nuxeo components scaffolding. It lets you easily scaffold common Nuxeo components like empty projects, Nuxeo Packages, Automation Operations, Nuxeo Services... This saves you time writing boilerplate code to focus on your code instead of the structure.

The generated components all come with unit tested sample code; for instance the Operation generator adds an Operation with some sample code that highlights how to inject context objects, how to specify a parameter and how to unit test that operation.

That tool is based on [Yeoman](http://yeoman.io) (a scaffolding tool for the web).

## Features
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

## Supported Nuxeo Platform Versions
- Nuxeo Platform 7.10 and newer
- If you are using Nuxeo Platform 5.8 or 6.0, code templates are available in [Nuxeo IDE](https://doc.nuxeo.com/x/ZYKE) using the [Nuxeo wizard](https://doc.nuxeo.com/x/uoSN).

# Installation

## Requirements

- [node.js](https://nodejs.org/) 0.12.10 or newer. The "stable" version is recommended (5.7.0 at the time of this writing).
- [npm](https://www.npmjs.com/) 2.12.0 or newer.

## Install

First, install [Yeoman](http://yeoman.io) and [generator-nuxeo](https://github.com/nuxeo/generator-nuxeo/tree/master):

```bash
# Global NPM registry install
npm install -g yo generator-nuxeo
# Install from master
npm install -g yo nuxeo/generator-nuxeo
```

# Quickstart
## Bootstrap an Empty Nuxeo Project
To create an empty Nuxeo Project (based on a Maven multi-module project), execute the following lines:

```bash
mkdir my-project
cd my-project
yo nuxeo
```

Default values are fine for a quick start. You will have to specify at least your project group ID (for instance `my.company`.)

# Usage
You can create several modules at once like:

```bash
yo nuxeo [options] [<generator>..]
```

## Options

```
-h,   --help          # Print the generator's options and usage
      --skip-cache    # Do not remember prompt answers                         Default: false
      --skip-install  # Do not automatically install dependencies              Default: false
-n,   --meta          # Branch of `nuxeo/generator-nuxeo-meta`                 Default: stable
-l,   --localPath     # Path to a local clone of `nuxeo/generator-nuxeo-meta`
-n,   --nologo        # Disable welcome logo                                   Default: false
-t,   --type          # Set module target's type                               Default: core
```

# Available Generators
The main Generator can call small generators defined in [https://github.com/nuxeo/generator-nuxeo-meta/](https://github.com/nuxeo/generator-nuxeo-meta/).

## Multi module
Set up an empty Nuxeo Bundle using Maven multi module support.

```bash
yo nuxeo multi-module
```

`multi-module` is the default generator when none is given as a parameter to `yo nuxeo`

### Parameters:
- **Use a parent artifact**: Parent artifact makes your project inherit dependencies, properties and other fields from another project. We recommend to keep the default value and use `org.nuxeo.ecm.distribution:nuxeo-distribution`.
- **Nuxeo Version**: _Asked only if no parent specified_, it specify which Nuxeo version of the dependency management will be imported.

### Important Notes
Using a Maven multi module architecture is the recommended way to bootstrap a new project: it allows to generate a Nuxeo Package afterwards to easily deploy your code on a Nuxeo Platform instance. On the other hand, when a project has been generated using a single module architecture, the Nuxeo Package needs to be created manually.

## Single module
Sets up an empty Nuxeo Bundle.

```bash
yo nuxeo single-module
```

### Parameters:
- **Parent Group / Artifact**: Like in `multi-module`, having a parent artifact make project inheritance. If you are in a `multi-module`, you must set your parent module. If not, you can use `org.nuxeo.ecm.distribution:nuxeo-distribution` or `org.nuxeo:nuxeo-addons-parent`
- **Nuxeo Version**: _Asked only if needed_, it specify which Nuxeo version of the dependency management will be imported.

### Important Notes
This option should not be called directly to bootstrap a new project; use the multi-module option instead so that you can generate a Nuxeo Package later on.

## Operation
Adds an empty Nuxeo Automation [Operation](https://doc.nuxeo.com/x/Go0ZAQ) along with a corresponding unit test.

```bash
yo nuxeo operation
```

## Listener
Adds a [listener](https://doc.nuxeo.com/x/C4AO) with its test class, the events will be asked during the generation process. Both existing and custom events can be declared. You can create any listener type: pre-commit, post-commit, synchronous and asynchronous.

```bash
yo nuxeo listener
```

### Parameters:
- **Trigger on events**: List of some common events to bind to your listener.
- **Custom Events**: _In case you select 'custom events'_ in the previous list; comma separate list of other events.
- **Asynchronous Listener**: if you need to run after the transaction has committed, in a new transaction and a separate thread. This is useful for any long-running operations whose result doesn't have to be seen immediately in the user interface.
- **Post-commit Listener**: if you need to run after the transaction has committed, in a new transaction but in the same thread, this is useful for logging.

## Nuxeo Service
Adds a [Nuxeo component](https://doc.nuxeo.com/x/DIAO) exposed as a Nuxeo service.

```bash
yo nuxeo service
```

## Nuxeo Content Enricher
Creates a [Content Enricher](https://doc.nuxeo.com/x/5wUuAQ) that enriches with more information a REST response.

```bash
yo nuxeo enricher
```

## Nuxeo Package
Creates a Maven module to handle a [Nuxeo Package](https://doc.nuxeo.com/x/CwIz) generation of your project. **Can only be called in a Maven multi-module architecture**, hence make sure to bootstrap your project using `yo nuxeo` or `yo nuxeo multi-module`. If you used `yo nuxeo single-module` to bootstrap your project, you won't be able to call that option afterwards.

```bash
yo nuxeo package
```

# Test locally the generator
To test the generator; you should clone the repository and link it to your local NPM registry:

```bash
git clone https://github.com/nuxeo/generator-nuxeo
cd generator-nuxeo
npm link
```

It will install dependencies and symlink the module to your local registry. After that, you can use the generator as described below.

# Licensing
[Apache License, Version 2.0](http://www.apache.org/licenses/LICENSE-2.0)

# About Nuxeo
Nuxeo dramatically improves how content-based applications are built, managed and deployed, making customers more agile, innovative and successful. Nuxeo provides a next generation, enterprise ready platform for building traditional and cutting-edge content oriented applications. Combining a powerful application development environment with SaaS-based tools and a modular architecture, the Nuxeo Platform and Products provide clear business value to some of the most recognizable brands including Verizon, Electronic Arts, Netflix, Sharp, FICO, the U.S. Navy, and Boeing. Nuxeo is headquartered in New York and Paris. More information is available at [www.nuxeo.com](http://www.nuxeo.com).
