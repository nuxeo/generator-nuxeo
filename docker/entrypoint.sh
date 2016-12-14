#!/bin/bash -

chmod g+rwx /root /root/.config /root/.config/configstore /workdir /distribution

yo --dirname=${workdir:-workdir} --skipInstall=true $@