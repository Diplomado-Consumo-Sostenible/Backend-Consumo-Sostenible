import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateReviewEntity1778284765158 implements MigrationInterface {
    name = 'CreateReviewEntity1778284765158'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."review_sentiment_enum" AS ENUM('Positive', 'Neutral', 'Negative')`);
        await queryRunner.query(`CREATE TABLE "review" ("id_review" SERIAL NOT NULL, "rating" integer NOT NULL, "comment" text NOT NULL, "sentiment" "public"."review_sentiment_enum" NOT NULL DEFAULT 'Neutral', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id_usuario" integer, "id_business" integer, CONSTRAINT "UQ_da3d0e79fc18aa2f7aaa601b893" UNIQUE ("id_usuario", "id_business"), CONSTRAINT "PK_9e5845ef64f912a98908bb1aa0a" PRIMARY KEY ("id_review"))`);
        await queryRunner.query(`ALTER TABLE "business" ADD "average_rating" numeric(3,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "business" ADD "total_reviews" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "business" ADD "ai_reviews_summary" text`);
        await queryRunner.query(`ALTER TABLE "business" ADD "ai_summary_updated_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "review" ADD CONSTRAINT "FK_a960e184228d247e738929281b8" FOREIGN KEY ("id_usuario") REFERENCES "user"("id_usuario") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "review" ADD CONSTRAINT "FK_45fcf4ad50339bb073b47a90d08" FOREIGN KEY ("id_business") REFERENCES "business"("id_business") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "review" DROP CONSTRAINT "FK_45fcf4ad50339bb073b47a90d08"`);
        await queryRunner.query(`ALTER TABLE "review" DROP CONSTRAINT "FK_a960e184228d247e738929281b8"`);
        await queryRunner.query(`ALTER TABLE "business" DROP COLUMN "ai_summary_updated_at"`);
        await queryRunner.query(`ALTER TABLE "business" DROP COLUMN "ai_reviews_summary"`);
        await queryRunner.query(`ALTER TABLE "business" DROP COLUMN "total_reviews"`);
        await queryRunner.query(`ALTER TABLE "business" DROP COLUMN "average_rating"`);
        await queryRunner.query(`DROP TABLE "review"`);
        await queryRunner.query(`DROP TYPE "public"."review_sentiment_enum"`);
    }

}
