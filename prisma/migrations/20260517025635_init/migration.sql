-- CreateTable
CREATE TABLE "versiones_biblia" (
    "id" SERIAL NOT NULL,
    "codigo" VARCHAR(20) NOT NULL,
    "nombre" VARCHAR(120) NOT NULL,
    "idioma" VARCHAR(10) NOT NULL DEFAULT 'es',
    "es_default" BOOLEAN NOT NULL DEFAULT false,
    "es_premium" BOOLEAN NOT NULL DEFAULT false,
    "licencia" TEXT,
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "versiones_biblia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "libros" (
    "id" SERIAL NOT NULL,
    "codigo" VARCHAR(10) NOT NULL,
    "nombre" VARCHAR(60) NOT NULL,
    "nombre_corto" VARCHAR(20) NOT NULL,
    "testamento" VARCHAR(2) NOT NULL,
    "orden" SMALLINT NOT NULL,
    "num_capitulos" SMALLINT NOT NULL,

    CONSTRAINT "libros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "versiculos" (
    "id" BIGSERIAL NOT NULL,
    "version_id" INTEGER NOT NULL,
    "libro_id" INTEGER NOT NULL,
    "capitulo" SMALLINT NOT NULL,
    "versiculo" SMALLINT NOT NULL,
    "texto" TEXT NOT NULL,
    "texto_busqueda" tsvector,

    CONSTRAINT "versiculos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estados_animo" (
    "id" SERIAL NOT NULL,
    "slug" VARCHAR(40) NOT NULL,
    "nombre" VARCHAR(60) NOT NULL,
    "descripcion" TEXT,
    "emoji" VARCHAR(10),
    "color_hex" VARCHAR(7),
    "frase_aliento" TEXT NOT NULL,
    "categoria" VARCHAR(20) NOT NULL,
    "orden" SMALLINT NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "estados_animo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "versiculo_estado" (
    "id" BIGSERIAL NOT NULL,
    "versiculo_id" BIGINT NOT NULL,
    "estado_id" INTEGER NOT NULL,
    "relevancia" SMALLINT NOT NULL DEFAULT 5,
    "intensidad" SMALLINT,
    "notas" TEXT,
    "verificado" BOOLEAN NOT NULL DEFAULT false,
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "versiculo_estado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "temas" (
    "id" SERIAL NOT NULL,
    "slug" VARCHAR(40) NOT NULL,
    "nombre" VARCHAR(60) NOT NULL,

    CONSTRAINT "temas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "versiculo_tema" (
    "versiculo_id" BIGINT NOT NULL,
    "tema_id" INTEGER NOT NULL,

    CONSTRAINT "versiculo_tema_pkey" PRIMARY KEY ("versiculo_id","tema_id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clerk_id" VARCHAR(120),
    "email" VARCHAR(160),
    "nombre" VARCHAR(80),
    "version_pref_id" INTEGER,
    "hora_recordatorio" TIME(0),
    "premium_hasta" TIMESTAMPTZ(6),
    "payment_provider" VARCHAR(20),
    "stripe_customer_id" VARCHAR(120),
    "stripe_subscription_id" VARCHAR(120),
    "mercadopago_subscription_id" VARCHAR(120),
    "paypal_subscription_id" VARCHAR(120),
    "rol" VARCHAR(20) NOT NULL DEFAULT 'usuario',
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ultimo_acceso" TIMESTAMPTZ(6),

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historial_animo" (
    "id" BIGSERIAL NOT NULL,
    "usuario_id" UUID NOT NULL,
    "estado_id" INTEGER NOT NULL,
    "versiculo_id" BIGINT,
    "contexto" VARCHAR(40),
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historial_animo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "versiculos_guardados" (
    "id" BIGSERIAL NOT NULL,
    "usuario_id" UUID NOT NULL,
    "versiculo_id" BIGINT NOT NULL,
    "nota_personal" TEXT,
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "versiculos_guardados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rotacion_usuario" (
    "usuario_id" UUID NOT NULL,
    "estado_id" INTEGER NOT NULL,
    "ultimo_indice" INTEGER NOT NULL DEFAULT 0,
    "versiculo_id" BIGINT,
    "fecha" DATE NOT NULL,

    CONSTRAINT "rotacion_usuario_pkey" PRIMARY KEY ("usuario_id","estado_id")
);

-- CreateTable
CREATE TABLE "suscripciones" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "usuario_id" UUID NOT NULL,
    "provider" VARCHAR(20) NOT NULL,
    "external_id" VARCHAR(200) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "plan" VARCHAR(20) NOT NULL,
    "period_start" TIMESTAMPTZ(6) NOT NULL,
    "period_end" TIMESTAMPTZ(6) NOT NULL,
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "suscripciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "versiones_biblia_codigo_key" ON "versiones_biblia"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "libros_codigo_key" ON "libros"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "libros_orden_key" ON "libros"("orden");

-- CreateIndex
CREATE INDEX "idx_versiculos_ref" ON "versiculos"("libro_id", "capitulo", "versiculo");

-- CreateIndex
CREATE INDEX "idx_versiculos_version" ON "versiculos"("version_id");

-- CreateIndex
CREATE UNIQUE INDEX "versiculos_version_id_libro_id_capitulo_versiculo_key" ON "versiculos"("version_id", "libro_id", "capitulo", "versiculo");

-- CreateIndex
CREATE UNIQUE INDEX "estados_animo_slug_key" ON "estados_animo"("slug");

-- CreateIndex
CREATE INDEX "idx_ve_estado_relevancia" ON "versiculo_estado"("estado_id", "relevancia" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "versiculo_estado_versiculo_id_estado_id_key" ON "versiculo_estado"("versiculo_id", "estado_id");

-- CreateIndex
CREATE UNIQUE INDEX "temas_slug_key" ON "temas"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_clerk_id_key" ON "usuarios"("clerk_id");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "idx_historial_usuario" ON "historial_animo"("usuario_id", "creado_en" DESC);

-- CreateIndex
CREATE INDEX "idx_guardados_usuario" ON "versiculos_guardados"("usuario_id", "creado_en" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "versiculos_guardados_usuario_id_versiculo_id_key" ON "versiculos_guardados"("usuario_id", "versiculo_id");

-- CreateIndex
CREATE INDEX "idx_rotacion_fecha" ON "rotacion_usuario"("usuario_id", "fecha" DESC);

-- AddForeignKey
ALTER TABLE "versiculos" ADD CONSTRAINT "versiculos_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "versiones_biblia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "versiculos" ADD CONSTRAINT "versiculos_libro_id_fkey" FOREIGN KEY ("libro_id") REFERENCES "libros"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "versiculo_estado" ADD CONSTRAINT "versiculo_estado_versiculo_id_fkey" FOREIGN KEY ("versiculo_id") REFERENCES "versiculos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "versiculo_estado" ADD CONSTRAINT "versiculo_estado_estado_id_fkey" FOREIGN KEY ("estado_id") REFERENCES "estados_animo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "versiculo_tema" ADD CONSTRAINT "versiculo_tema_versiculo_id_fkey" FOREIGN KEY ("versiculo_id") REFERENCES "versiculos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "versiculo_tema" ADD CONSTRAINT "versiculo_tema_tema_id_fkey" FOREIGN KEY ("tema_id") REFERENCES "temas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_version_pref_id_fkey" FOREIGN KEY ("version_pref_id") REFERENCES "versiones_biblia"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_animo" ADD CONSTRAINT "historial_animo_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_animo" ADD CONSTRAINT "historial_animo_estado_id_fkey" FOREIGN KEY ("estado_id") REFERENCES "estados_animo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_animo" ADD CONSTRAINT "historial_animo_versiculo_id_fkey" FOREIGN KEY ("versiculo_id") REFERENCES "versiculos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "versiculos_guardados" ADD CONSTRAINT "versiculos_guardados_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "versiculos_guardados" ADD CONSTRAINT "versiculos_guardados_versiculo_id_fkey" FOREIGN KEY ("versiculo_id") REFERENCES "versiculos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rotacion_usuario" ADD CONSTRAINT "rotacion_usuario_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rotacion_usuario" ADD CONSTRAINT "rotacion_usuario_estado_id_fkey" FOREIGN KEY ("estado_id") REFERENCES "estados_animo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rotacion_usuario" ADD CONSTRAINT "rotacion_usuario_versiculo_id_fkey" FOREIGN KEY ("versiculo_id") REFERENCES "versiculos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suscripciones" ADD CONSTRAINT "suscripciones_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
