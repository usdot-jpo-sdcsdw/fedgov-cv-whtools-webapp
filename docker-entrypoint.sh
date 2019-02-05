#!/bin/sh -xe

UTIL_JAR=$JETTY_HOME/lib/jetty-util-*.jar
PASSWORD_CLASS=org.eclipse.jetty.util.security.Password
START_INI="$JETTY_BASE/start.d/server.ini"
JETTY_KEYSTORE_PATH=$JETTY_BASE/etc/keystore
OBF_PASSWORD=$(java -cp $UTIL_JAR $PASSWORD_CLASS $JETTY_KEYSTORE_PASSWORD 2>&1 | grep OBF)

echo '--module=https' >> $START_INI
echo '--module=ssl' >> $START_INI

([ "$OBF_PASSWORD" ] || (echo "No password provided" && exit -1))
echo jetty.truststore.password=$OBF_PASSWORD >> $START_INI
echo jetty.keystore.password=$OBF_PASSWORD >> $START_INI
echo jetty.keymanager.password=$OBF_PASSWORD >> $START_INI



if [ -n "$TRUST_KEYSTORE" ]; then
    DEFAULT_JAVA_TRUSTSTORE_PATH=/etc/ssl/certs/java/cacerts
    DEFAULT_JAVA_TRUSTSTORE_PASSWORD=changeit
    
    keytool -importkeystore \
        -srckeystore $JETTY_KEYSTORE_PATH \
        -srcstorepass $JETTY_KEYSTORE_PASSWORD \
        -destkeystore $DEFAULT_JAVA_TRUSTSTORE_PATH \
        -deststorepass $DEFAULT_JAVA_TRUSTSTORE_PASSWORD \

fi

su -s /bin/sh jetty -- /jetty-docker-entrypoint.sh $@