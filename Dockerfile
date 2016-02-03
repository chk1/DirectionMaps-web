# Use phusion/baseimage as base image. To make your builds reproducible, make
# sure you lock down to a specific version, not to `latest`!
# See https://github.com/phusion/baseimage-docker/blob/master/Changelog.md for
# a list of version numbers.
FROM phusion/baseimage:0.9.18

# Use baseimage-docker's init system.
CMD ["/sbin/my_init"]

# add repositories/ppa for Mapnik, OpenJDK 8, NodeJS 4
RUN DEBIAN_FRONTEND=noninteractive add-apt-repository ppa:mapnik/nightly-2.3
RUN DEBIAN_FRONTEND=noninteractive add-apt-repository ppa:openjdk-r/ppa
RUN curl -sL https://deb.nodesource.com/setup_4.x | bash -

RUN apt-get update

RUN DEBIAN_FRONTEND=noninteractive apt-get install -y libmapnik libmapnik-dev mapnik-utils python-mapnik
RUN DEBIAN_FRONTEND=noninteractive apt-get install -y mapnik-input-plugin-ogr
RUN DEBIAN_FRONTEND=noninteractive apt-get install -y openjdk-8-jre-headless
RUN DEBIAN_FRONTEND=noninteractive apt-get install -y python-psycopg2
RUN /var/lib/dpkg/info/ca-certificates-java.postinst configure
RUN DEBIAN_FRONTEND=noninteractive apt-get install -y git nodejs

ADD . /data/DirectionMaps-web
WORKDIR /data
RUN git clone --depth 1 https://github.com/chk1/DirectionMaps-Rendering
RUN git clone --depth 1 https://github.com/mrunde/DirectionMaps-Backend
ADD config.xml /data/DirectionMaps-Rendering/config.xml
RUN mkdir -p /data/dirmapsdata/src/res
RUN mkdir /data/dirmapsdata/out
RUN cp /data/DirectionMaps-Backend/src/res/landmarks.xml /data/dirmapsdata/src/res/landmarks.xml 

RUN apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

WORKDIR /data/DirectionMaps-web
RUN npm install

EXPOSE 3000
CMD ["nodejs", "index.js"]