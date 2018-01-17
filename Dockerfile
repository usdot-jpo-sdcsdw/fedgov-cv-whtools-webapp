FROM jetty:9.3.11-jre8-alpine

# The relative path to the shared object for the codec shared object
ARG CODEC_SO_PATH=target/libper-xer-codec.so

# Mount the keystore here
VOLUME $JETTY_HOME/etc/keystore_mount

ENV JETTY_KEYSTORE_PASSWORD=CHANGEME
# The relative path from $JETTY_HOME/etc/keystore_mount your keystore is placed in
ENV JETTY_KEYSTORE_RELATIVE_PATH=keystore

# This next section is needed to deal with the fact that the "Go Daddy Secure Certificate Authority" is not present on the openjdk 8 image 

# The relative path from $JETYTY_HOME/etc/keystore_mount the certificate to install to cacerts is placed in
#ENV MISSING_CERTIFICATE_RELATIVE_PATH=missing1.crt
# This is actually the default location of the keystore, don't modify unless you are moving the keystore yourself
#ENV JAVA_KEYSTORE_PATH=$JAVA_HOME/lib/security/cacerts
# This is actually the default password, don't modify unless you are modifying the keystore yourself
#ENV JAVA_KEYSTORE_PASSWORD=changeit
#COPY trust-cert.sh "$JETTY_HOME/trust-cert.sh"
#RUN chmod +x "$JETTY_HOME/trust-cert.sh"

WORKDIR $JETTY_HOME

COPY target/whtools.war "$JETTY_HOME/webapps/whtools.war"
COPY ${CODEC_SO_PATH} /usr/lib/libper-xer-codec.so
COPY run-webapp.sh "$JETTY_HOME/run-webapp.sh"
RUN chmod +x "$JETTY_HOME/run-webapp.sh"

RUN echo '--module=https' >> "$JETTY_HOME/start.ini"; \
    echo '--module=ssl' >> "$JETTY_HOME/start.ini";
    
    #echo jetty.sslContext.trustStorePassword=`cat passobf` >> "$JETTY_HOME/modules/ssl.mod"; \
    #echo jetty.sslContext.keyStorePassword=`cat passobf` >> "$JETTY_HOME/modules/ssl.mod"; \
    #echo jetty.sslContext.keyManagerPassword=`cat passobf` >> "$JETTY_HOME/modules/ssl.mod"; \ 



#ENTRYPOINT /bin/sh -c "./trust-cert.sh && ./run-webapp.sh"
ENTRYPOINT /bin/sh -c "./run-webapp.sh"