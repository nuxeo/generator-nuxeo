[![Build Status](https://qa.nuxeo.org/jenkins/buildStatus/icon?job=master/tools_generator-nuxeo-master)](https://qa.nuxeo.org/jenkins/job/master/job/tools_generator-nuxeo-master/)
[![npm version](https://img.shields.io/npm/v/generator-nuxeo.svg?style=flat-square)](https://www.npmjs.com/package/generator-nuxeo)
[![npm downloads](https://img.shields.io/npm/dm/generator-nuxeo.svg?style=flat-square)](https://www.npmjs.com/package/generator-nuxeo)
[![Dependency Status](https://img.shields.io/david/nuxeo/generator-nuxeo.svg?style=flat-square)](https://david-dm.org/nuxeo/generator-nuxeo) [![devDependency Status](https://img.shields.io/david/dev/nuxeo/generator-nuxeo.svg?style=flat-square)](https://david-dm.org/nuxeo/generator-nuxeo#info=devDependencies)


# About
**Yeoman Generator for Nuxeo Platform**

The `generator-nuxeo` provides Nuxeo components scaffolding. It lets you easily scaffold common Nuxeo components like empty projects, Nuxeo Packages, Automation Operations, Nuxeo Services... This saves you time writing boilerplate code to focus on your code instead of the structure.

The generated components all come with unit tested sample code; for instance the Operation generator adds an Operation with some sample code that highlights how to inject context objects, how to specify a parameter and how to unit test that operation.

That tool is based on [Yeoman](http://yeoman.io) (a scaffolding tool for the web).

## Generator Features
- Trigger the Hot reload which allows you to update the deployed bundles without restarting the Nuxeo Server.
- Connect your project to a Studio's one
- Discover some sample Nuxeo Projects.
- Bootstrap an empty Nuxeo Project with multi modules support.
- Bootstrap a single empty Nuxeo Project.
- Initiate an empty component or an empty unit test
- Add a Nuxeo Package module to distribute your Project ([Marketplace](https://connect.nuxeo.com/nuxeo/site/marketplace))
- Add a ready-to-use empty [Polymer](https://www.polymer-project.org) or [Angular2](https://angular.io/) Application.
- Create your own business rules or logic as an [Automation Operation](https://doc.nuxeo.com/x/Go0ZAQ).
- Enrich REST API responses using a [content-enricher](https://doc.nuxeo.com/x/5wUuAQ).
- Manipulate Business Object using a Document Adapter
- Declare your new [Nuxeo Service](https://doc.nuxeo.com/x/DIAO)
- Plug your logic to the event bus using an [Event Listener](https://doc.nuxeo.com/x/C4AO)

## Supported Nuxeo Platform Versions
- Nuxeo Platform 7.10 and newer
- If you are using Nuxeo Platform 5.8 or 6.0, code templates are available in [Nuxeo IDE](https://doc.nuxeo.com/x/ZYKE) using the [Nuxeo wizard](https://doc.nuxeo.com/x/uoSN).

# Local Installation

## Requirements

- [node.js](https://nodejs.org/) v6.0.0 or newer.
- [npm](https://www.npmjs.com/) v3.0.0 or newer.

## [DEPRECATED] - Install

> We strongly recommend you to use our new tool [Nuxeo CLI](https://www.npmjs.com/package/nuxeo-cli) instead of the generator. It embbed all generator's features in a more friendly command line interface.

First, install [Yeoman](http://yeoman.io) and [generator-nuxeo](https://github.com/nuxeo/generator-nuxeo/tree/master):

```bash
# Global NPM registry install
npm install -g yo generator-nuxeo
```

OR

```bash
# Install from master
npm install -g yo nuxeo/generator-nuxeo
```

# Quickstart

## Discover Sample Projects

Using the generator let you have access to some ready to use Nuxeo Code Sample:

```bash
yo nuxeo:sample
```

## Hot Reload

Using the generator let you trigger a Hot Reload on your Server which allows you to update the deployed bundles without restarting the Nuxeo Server. To be done, it requires to enable the `sdk` template in your `nuxeo.conf` file.

First step is to associate a Nuxeo Server with your project root. It will ask you the distribution path and if you want to let the `generator-nuxeo` configure the file for you. Reexecute it to change the distribution path.

```bash
yo nuxeo:hotreload configure
```

Then, you will be able to trigger it using:

```bash
yo nuxeo:hotreload
```

## Synchronize

Using this generator lets you synchronize two folders, and automatically create folder/copy/delete files from a `source` folder to a `destination` folder. It helps you automatically copying web resources from your source code to the a running server for previewing your changes live.

First step is to configure the synchronize command for relying either on Docker implementation, or a Local one depending on how you deploy your Nuxeo Server. You'll be prompted to configure a pattern of file matching the synchronize in order to prevent you from copying files you don't need (temp file, zip, ...). The default value is: `*.+(js|html|jpg|gif|svg|png|json|jsp)`.

```bash
yo nuxeo:synchronize configure
```

For starting files changes and synchronize two folders, execute:

```bash
yo nuxeo:synchronize
```

## Studio Connection

Connect your Java project let you have your Studio Project exposed as a dependency and be able to tests anything declared in it, like your Automation Scripting, listeners, Document Types, ...

Link your project to Studio:

```bash
yo nuxeo:studio [link]
```

Unlink your project:

```bash
yo nuxeo:studio unlink
```

Generate a Java Constant class with Studio's freatures

```bash
yo nuxeo:studio import
```

Release your studio project

```bash
yo nuxeo:studio release
```

## Bootstrap an Empty Nuxeo Project with Multi Modules Support

To bootstrap an empty Nuxeo Project (based on a Maven multi-module project), execute the following lines:

```bash
mkdir my-project
cd my-project
yo nuxeo
```

Default values are fine for a quick start. You will have to specify at least your project group ID (for instance `org.company`.)

# Usage
You can generate several features at once like:

```bash
yo nuxeo [options] [<generator>..]
```

## Options

```
  -h,   --help          # Print the generator's options and usage
        --skip-cache    # Do not remember prompt answers                         Default: false
        --skip-install  # Do not automatically install dependencies              Default: false
  -m,   --meta          # Branch of `nuxeo/generator-nuxeo-meta`                 Default: stable
  -l,   --localPath     # Path to a local clone of `nuxeo/generator-nuxeo-meta`
  -n,   --nologo        # Disable welcome logo                                   Default: false
  -t,   --type          # Set module target's type                               Default: core
  -s,   --skipInstall   # Skip external commands installation                    Default: false
  -f,   --force         # Force conflict when generate an existing file          Default: false
  -d,   --dirname       # Set parent folder prefix name                          Default: <PWD>
        --skipPomUpdate # Skip the pom(s) updates when attaching Studio project  Default: false
```

# Available Generators
The main Generator can render templates defined in [https://github.com/nuxeo/generator-nuxeo-meta/](https://github.com/nuxeo/generator-nuxeo-meta/).

> Terminology
>  - _ADD_: Add a dedicated module to your project. For instance, in a `myapp` project, a Polymer Application will add a `myapp-web` submodule.
>  - _CREATE_: Create the files needed for the feature, without specifying a `--type` option, the generation will occurs in the `myapp-core` submodule. When using the `--type` option, files will be generated to a (new) module named `myapp-{type}`;

## Bootstrap an Empty Nuxeo Project with Multi Modules
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

## Bootstrap a Single Empty Nuxeo Bundle
Sets up an empty Nuxeo bundle.

```bash
yo nuxeo single-module
```

### Parameters:
- **Parent Group / Artifact**: Like in `multi-module`, having a parent artifact make project inheritance. If you are in a `multi-module`, you must set your parent module. If not, you can use `org.nuxeo.ecm.distribution:nuxeo-distribution` or `org.nuxeo:nuxeo-addons-parent`
- **Nuxeo Version**: _Asked only if needed_, it specify which Nuxeo version of the dependency management will be imported.

### Important Notes
This option should not be called directly to bootstrap a new project; use the multi-module option instead so that you can generate a Nuxeo Package later on.

## Create an Empty Unit Test
Add an empty [Unit Test](https://doc.nuxeo.com/corg/unit-testing/)

```bash
yo nuxeo test-empty
```

## Create a Bare Component
Add an empty [Contribution](https://doc.nuxeo.com/nxdoc/contributing-to-nuxeo/)

```bash
yo nuxeo contribution
```

## Create Your Own Business Rules or Logic - Automation Operation
Adds an empty Automation [Operation](https://doc.nuxeo.com/x/Go0ZAQ) along with a corresponding unit test.

```bash
yo nuxeo operation
```

## Create an Event Bus Listener
Adds a [listener](https://doc.nuxeo.com/x/C4AO) with its test class, the events will be asked during the generation process. Both existing and custom events can be declared. You can create any listener type: pre-commit, post-commit, synchronous and asynchronous.

```bash
yo nuxeo listener
```

### Parameters:
- **Trigger on events**: List of some common events to bind to your listener.
- **Custom Events**: _In case you select 'custom events'_ in the previous list; comma separate list of other events.
- **Asynchronous Listener**: if you need to run after the transaction has committed, in a new transaction and a separate thread. This is useful for any long-running operations whose result doesn't have to be seen immediately in the user interface.
- **Post-commit Listener**: if you need to run after the transaction has committed, in a new transaction but in the same thread, this is useful for logging.

## Create a Service
Adds a [Nuxeo component](https://doc.nuxeo.com/x/DIAO) exposed as a Nuxeo service.

```bash
yo nuxeo service
```

## Create a REST API Response Enricher
Creates a [Content Enricher](https://doc.nuxeo.com/x/5wUuAQ) that enriches with more information a REST response.

```bash
yo nuxeo enricher
```

## Create a Business Object - Document Adapter
Creates a Document Adapter that turn `DocumentModel` object into business objects.

```bash
yo nuxeo adapter
```

## Add an Empty Polymer Application
Add an application based on [Polymer Starter Kit](https://github.com/PolymerElements/polymer-starter-kit) bundled as a Nuxeo Project.

```bash
yo nuxeo polymer
# npm and bower install must be executed automatically, otherwise:
# cd *-web && npm install && bower install

# To run the application in dev mode; with file changes watch:
cd *-web && npm run serve
```

### Warning
Common bundle's files like `MANIFEST.MF` and `OSGI-INF/*` are stored inside a `nuxeo` folder.

## Add an Empty Angular2 Application
Add an application using [Angular2](https://angular.io/) bundled as a Nuxeo Project.

```bash
yo nuxeo angular2
# npm and bower install must be executed automatically, otherwise:
# cd *-web && npm install && bower install

# To run the application in dev mode; with file changes watch:
cd *-web && npm run dev
```

## Add a Nuxeo Package Module
Creates a module to handle a [Nuxeo Package](https://doc.nuxeo.com/x/CwIz) generation of your project. **Can only be called in a Maven multi-module architecture**, hence make sure to bootstrap your project using `yo nuxeo` or `yo nuxeo multi-module`. If you used `yo nuxeo single-module` to bootstrap your project, you won't be able to call that option afterwards.

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
Nuxeo dramatically improves how content-based applications are built, managed and deployed, making customers more agile, innovative and successful. Nuxeo provides a next generation, enterprise ready platform for building traditional and cutting-edge content oriented applications. Combining a powerful application development environment with SaaS-based tools and a modular architecture, the Nuxeo Platform and Products provide clear business value to some of the most recognizable brands including Verizon, Electronic Arts, Sharp, FICO, the U.S. Navy, and Boeing. Nuxeo is headquartered in New York and Paris. More information is available at [www.nuxeo.com](http://www.nuxeo.com).
