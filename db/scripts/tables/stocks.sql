CREATE TABLE public.stocks (
	product_id uuid NOT NULL,
	count integer DEFAULT 0,
	CONSTRAINT fk_product
		FOREIGN KEY (product_id)
			REFERENCES public.products(id) ON DELETE CASCADE ON UPDATE CASCADE
);