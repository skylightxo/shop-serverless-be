-- PostgreSQL only

CREATE extension if not exists pgcrypto;
SELECT gen_random_uuid();
