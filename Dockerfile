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
RUN /var/lib/dpkg/info/ca-certificates-java.postinst configure
RUN DEBIAN_FRONTEND=noninteractive apt-get install -y git nodejs

WORKDIR /data
RUN git clone https://github.com/chk1/DirectionMaps-Rendering
RUN git clone https://github.com/mrunde/DirectionMaps-Backend
# RUN python from-geojson.py

RUN apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*