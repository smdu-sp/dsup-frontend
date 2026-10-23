-- CreateTable
CREATE TABLE `historico_tecnicos` (
    `id` VARCHAR(191) NOT NULL,
    `servico_id` VARCHAR(191) NOT NULL,
    `tecnico_anterior_id` VARCHAR(191) NOT NULL,
    `tecnico_novo_id` VARCHAR(191) NOT NULL,
    `alterado_por_id` VARCHAR(191) NOT NULL,
    `alterado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `historico_tecnicos` ADD CONSTRAINT `historico_tecnicos_servico_id_fkey` FOREIGN KEY (`servico_id`) REFERENCES `servicos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `historico_tecnicos` ADD CONSTRAINT `historico_tecnicos_tecnico_anterior_id_fkey` FOREIGN KEY (`tecnico_anterior_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `historico_tecnicos` ADD CONSTRAINT `historico_tecnicos_tecnico_novo_id_fkey` FOREIGN KEY (`tecnico_novo_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `historico_tecnicos` ADD CONSTRAINT `historico_tecnicos_alterado_por_id_fkey` FOREIGN KEY (`alterado_por_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
