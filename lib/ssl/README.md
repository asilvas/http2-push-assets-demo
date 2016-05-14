## Create Self-Signed Cert

https://blog.talpor.com/2015/07/ssltls-certificates-beginners-tutorial/

openssl req -x509 -newkey rsa:2048 -keyout private.key -out public.crt -days 365 -nodes -subj "/C=US/ST=Arizona/L=Phoenix/O=LOCAL/CN=localhost"


## Root CA

openssl genrsa -out rootca.key 8192

## Create Self-Signed Root CA

openssl req -sha256 -new -x509 -days 1826 -key rootca.key -out rootca.crt -subj "/C=US/ST=Arizona/L=Phoenix/O=LOCAL/CN=localhost"


## Create the Intermediate Key

openssl genrsa -out intermediate1.key 4096

openssl req -new -sha256 -key intermediate1.key -out intermediate1.csr -subj "/C=US/ST=Arizona/L=Phoenix/O=LOCAL/CN=localhost"

openssl ca -batch -notext -key intermediate1.key -in intermediate1.csr -out intermediate1.crt







openssl req -nodes -newkey rsa:2048 -keyout private.key -out private.csr

openssl req -nodes -newkey rsa:2048 -keyout private.key -out private.csr -subj "/C=US/ST=Arizona/L=Phoenix/O=LOCAL/CN=localhost"