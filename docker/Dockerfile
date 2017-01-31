# vim:set ft=dockerfile:
FROM       node:6-slim
MAINTAINER Nuxeo <packagers@nuxeo.com>

RUN cd /opt && \
    wget https://github.com/nuxeo/generator-nuxeo/archive/master.tar.gz && \
    tar zxf master.tar.gz && \
    rm master.tar.gz && \
    cd generator-nuxeo-master && \
    npm install -g yo && \
    npm link && \
    npm cache clear && \
    mkdir -p /root/.config/configstore /workdir /opt/server/nuxeo && \
    echo '{"clientId": 0, "optOut": true}' > /root/.config/configstore/insight-yo.json

WORKDIR /workdir
VOLUME  /workdir
VOLUME  /opt/server/nuxeo
ADD entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
CMD ["nuxeo"]
