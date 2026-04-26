import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTimestampsPerfil1777236395074 implements MigrationInterface {
    name = 'AddTimestampsPerfil1777236395074'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "perfil" 
            ADD "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
        `);

        await queryRunner.query(`
            ALTER TABLE "perfil" 
            ADD "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "perfil" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "perfil" DROP COLUMN "createdAt"`);
    }
}