CREATE TABLE public.products (
	id uuid DEFAULT gen_random_uuid(),
	title text NOT NULL,
	description text,
	price integer,
	PRIMARY KEY (id)
);