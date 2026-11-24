-- CreateTable
CREATE TABLE `tipos_chamado` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `cor` VARCHAR(191) NOT NULL DEFAULT 'neutral',
    `status` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `tipos_chamado_nome_key`(`nome`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Seed: migra os tipos hoje hardcoded no código (chamados/page.tsx) para a nova tabela
INSERT INTO `tipos_chamado` (`id`, `nome`, `cor`, `status`) VALUES
    ('a70d2a41-1cad-4c36-a57f-939173ba8796', 'Elétrica', 'primary', true),
    ('3fdaa178-8008-46a5-81ad-6f5e032fc640', 'Hidráulica', 'warning', true),
    ('f985d498-4dde-4d52-aaeb-4d023895e4ee', 'Telefonia', 'success', true),
    ('bc763368-7b28-48e7-b5ab-e4ba7ddf71ec', 'Outros', 'neutral', true);

-- AlterTable: adiciona tipo_id (nullable) para permitir o backfill abaixo
ALTER TABLE `ordens` ADD COLUMN `tipo_id` VARCHAR(191) NULL;

-- Backfill: migra o campo numérico antigo `tipo` (1=Elétrica, 2=Hidráulica, 3=Telefonia, 4=Outros).
-- 0 era só um valor-sentinela usado no filtro da listagem ("todos"), nunca persistido de fato;
-- qualquer resíduo com 0/NULL cai em "Outros" para não deixar ordem sem tipo.
UPDATE `ordens` SET `tipo_id` = 'a70d2a41-1cad-4c36-a57f-939173ba8796' WHERE `tipo` = 1;
UPDATE `ordens` SET `tipo_id` = '3fdaa178-8008-46a5-81ad-6f5e032fc640' WHERE `tipo` = 2;
UPDATE `ordens` SET `tipo_id` = 'f985d498-4dde-4d52-aaeb-4d023895e4ee' WHERE `tipo` = 3;
UPDATE `ordens` SET `tipo_id` = 'bc763368-7b28-48e7-b5ab-e4ba7ddf71ec' WHERE `tipo` = 4 OR `tipo_id` IS NULL;

-- AlterTable: torna tipo_id obrigatório e remove a coluna antiga
ALTER TABLE `ordens` MODIFY COLUMN `tipo_id` VARCHAR(191) NOT NULL;
ALTER TABLE `ordens` DROP COLUMN `tipo`;

-- AddForeignKey
ALTER TABLE `ordens` ADD CONSTRAINT `ordens_tipo_id_fkey` FOREIGN KEY (`tipo_id`) REFERENCES `tipos_chamado`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
