FROM phusion/baseimage:0.9.18
MAINTAINER Christoph Kisfeld <christoph.kisfeld@gmail.com>

# Use baseimage-docker's init system.
CMD ["/sbin/my_init"]

# Add repositories/ppa for Mapnik, OpenJDK 8, NodeJS 4
RUN DEBIAN_FRONTEND=noninteractive \
	add-apt-repository ppa:mapnik/nightly-2.3 && \
	add-apt-repository ppa:openjdk-r/ppa
RUN curl -sL https://deb.nodesource.com/setup_4.x | bash -

RUN apt-get update

RUN DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends libmapnik libmapnik-dev mapnik-utils python-mapnik mapnik-input-plugin-ogr openjdk-8-jre-headless python-psycopg2 git nodejs
RUN /var/lib/dpkg/info/ca-certificates-java.postinst configure

# Download and copy necessary files into place
COPY . /data/DirectionMaps-web
WORKDIR /data
RUN git clone --depth 1 https://github.com/chk1/DirectionMaps-Rendering && \
	git clone --depth 1 https://github.com/mrunde/DirectionMaps-Backend
COPY config.xml /data/DirectionMaps-Rendering/config.xml
RUN mkdir -p /data/dirmapsdata/src/res /data/dirmapsdata/out
RUN cp /data/DirectionMaps-Backend/src/res/landmarks.xml /data/dirmapsdata/src/res/landmarks.xml 

# Clean apt-get cache
RUN apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Switch workdir for running environment
WORKDIR /data/DirectionMaps-web
RUN npm install

# Set environment variables, used in index.js for locating the other projects
ENV DIRMAPS_DATAHOME="/data/dirmapsdata" DIRMAPS_DMALGDIR="/data/DirectionMaps-Backend/dist" DIRMAPS_RENDERDIR="/data/DirectionMaps-Rendering"

EXPOSE 3000
ENTRYPOINT ["nodejs", "index.js"]
