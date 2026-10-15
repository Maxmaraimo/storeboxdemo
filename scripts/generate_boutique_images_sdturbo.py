import os
import sys
import torch
from PIL import Image
from diffusers import AutoPipelineForText2Image

OUT_DIR = os.path.join("media", "products", "crystallami")
os.makedirs(OUT_DIR, exist_ok=True)

ITEMS = [
    # --- HERO BANNER ---
    {
        "type": "banner",
        "filename": "hero_banner_women.jpg",
        "width": 896,
        "height": 448,
        "prompt": "ultra wide panoramic high-fashion editorial campaign, group of three elegant female models in chic black and white luxury streetwear outfits, dramatic runway poses, pure seamless white cyclorama studio background #FFFFFF, soft floor shadow, high fashion magazine spread, sharp focus, 8k",
    },

    # --- DRESSES & BOUTIQUE APPAREL (7 items) ---
    {
        "slug": "dress_1",
        "mockup_p": "luxury off-shoulder white maxi evening dress with 3D floral rosette neckline and sheer chiffon bishop sleeves, front slit, ghost mannequin studio packshot on pure seamless white background #FFFFFF, soft contact shadow, high fashion, 8k",
        "model_p": "full body fashion editorial photo of beautiful female model wearing off-shoulder white maxi evening dress with floral rosette neckline and sheer chiffon bishop sleeves, pure seamless white background #FFFFFF, editorial studio lighting",
    },
    {
        "slug": "dress_2",
        "mockup_p": "minimalist pure white asymmetric tailored blazer dress with crystal buttons and sharp lapel collar, studio packshot on pure seamless white background #FFFFFF, soft contact shadow",
        "model_p": "fashion editorial photography of chic female model wearing modern white asymmetric blazer dress with crystal buttons, sleek hair, on pure seamless white background #FFFFFF",
    },
    {
        "slug": "dress_3",
        "mockup_p": "luxury plush white faux-fur zip-up cropped bomber jacket with high stand collar, studio product packshot on pure seamless white background #FFFFFF, soft contact shadow",
        "model_p": "fashion editorial photo of beautiful female model wearing plush white faux-fur zip-up bomber jacket, pure seamless white background #FFFFFF, studio flash lighting",
    },
    {
        "slug": "dress_4",
        "mockup_p": "vibrant fuchsia magenta pink silk satin maxi evening gown with elegant cowl neck draped silhouette, ghost mannequin studio packshot on pure seamless white background #FFFFFF",
        "model_p": "glamorous fashion editorial photo of female model wearing flowing fuchsia magenta silk satin maxi gown, standing on pure seamless white background #FFFFFF",
    },
    {
        "slug": "apparel_windbreaker",
        "mockup_p": "delicate blush pink sheer floral organza lace bomber jacket with ribbed collar and cuffs, studio packshot on pure seamless white background #FFFFFF",
        "model_p": "high-fashion editorial photography of female model wearing sheer pastel pink floral organza bomber jacket, pure seamless white background #FFFFFF",
    },
    {
        "slug": "apparel_blouse",
        "mockup_p": "vibrant red silk chiffon blouse with white polka dots, puff sleeves and ruffled collar, studio packshot on pure seamless white background #FFFFFF",
        "model_p": "fashion editorial photo of stylish female model wearing red and white polka dot chiffon blouse with puff sleeves, pure seamless white background #FFFFFF",
    },
    {
        "slug": "apparel_jeans",
        "mockup_p": "light blue wash vintage denim wide-leg baggy jeans with knee rips and raw hem, laid flat studio packshot on pure seamless white background #FFFFFF",
        "model_p": "full body fashion editorial of female model wearing light blue baggy wide-leg distressed jeans and white minimalist top, pure seamless white background #FFFFFF",
    },

    # --- SHOES (11 items) ---
    {
        "slug": "shoe_1",
        "mockup_p": "exotic python snakeskin pointed toe stiletto ankle booties, side view studio packshot on pure seamless white background #FFFFFF, soft floor shadow, high end luxury footwear",
        "model_p": "editorial fashion photo of female model legs wearing python snakeskin pointed stiletto ankle boots, minimalist look, pure seamless white background #FFFFFF",
    },
    {
        "slug": "shoe_2",
        "mockup_p": "transparent clear PVC block heel slip-on mules sandals with black leather insole, luxury designer packshot on pure seamless white background #FFFFFF",
        "model_p": "fashion editorial photography of female model wearing transparent clear vinyl block-heeled mules with black insole, on pure seamless white background #FFFFFF",
    },
    {
        "slug": "shoe_3",
        "mockup_p": "transparent clear vinyl block heel slide mules sandals with white leather footbed, studio packshot on pure seamless white background #FFFFFF",
        "model_p": "editorial fashion shot of woman wearing clear transparent vinyl block heel mules with white footbed, pure seamless white background #FFFFFF",
    },
    {
        "slug": "shoe_4",
        "mockup_p": "nude beige patent leather pointed toe pleated slingback pumps on slender stiletto heel, studio packshot on pure seamless white background #FFFFFF",
        "model_p": "high-fashion editorial of female model wearing nude beige patent pleated stiletto slingback pumps, pure seamless white background #FFFFFF",
    },
    {
        "slug": "shoe_5",
        "mockup_p": "cherry burgundy dark red patent leather pointed slingbacks with polished gold metal toe tip, kitten heel, studio packshot on pure seamless white background #FFFFFF",
        "model_p": "editorial photo of chic female model wearing deep burgundy patent pointed slingbacks with gold metal toe cap, pure seamless white background #FFFFFF",
    },
    {
        "slug": "shoe_6",
        "mockup_p": "glossy black patent leather pointed toe classic stiletto pumps with sleek silhouette, studio packshot on pure seamless white background #FFFFFF",
        "model_p": "fashion editorial of elegant female model wearing black glossy patent stiletto pumps, pure seamless white background #FFFFFF",
    },
    {
        "slug": "shoe_7",
        "mockup_p": "taupe beige velvety suede flat slip-on mules with chic twisted front knot, luxury designer slides, studio packshot on pure seamless white background #FFFFFF",
        "model_p": "quiet luxury fashion editorial of female model wearing taupe suede twisted knot flat mules, pure seamless white background #FFFFFF",
    },
    {
        "slug": "shoe_8",
        "mockup_p": "ivory white crocodile embossed pointed stiletto pumps with metallic gold metal stiletto heel, studio packshot on pure seamless white background #FFFFFF",
        "model_p": "editorial fashion photo of female model wearing ivory croc-embossed pointed pumps with gold stiletto heel, pure seamless white background #FFFFFF",
    },
    {
        "slug": "shoe_9",
        "mockup_p": "luxury flat black leather slide sandals with monogram strap and gold buckle, designer summer footwear packshot on pure seamless white background #FFFFFF",
        "model_p": "resort style editorial photography of female model wearing flat black leather monogram slide sandals with gold buckle, pure seamless white background #FFFFFF",
    },
    {
        "slug": "shoe_10",
        "mockup_p": "black patent leather pointed toe slingbacks with thin criss-cross buckle straps and slender heel, studio packshot on pure seamless white background #FFFFFF",
        "model_p": "fashion editorial of female model wearing black patent criss-cross strap pointed slingback heels, pure seamless white background #FFFFFF",
    },
    {
        "slug": "shoe_11",
        "mockup_p": "black patent pointed slingbacks with architectural flared hourglass heel and gold metal toe tip, studio packshot on pure seamless white background #FFFFFF",
        "model_p": "editorial haute couture photograph of female model wearing architectural flared heel black slingbacks with gold toe cap, pure seamless white background #FFFFFF",
    },

    # --- SNEAKERS (5 items) ---
    {
        "slug": "sneaker_1",
        "mockup_p": "black calfskin leather and suede winter low-top sneakers with plush cream shearling fur lining, thick designer sole, studio packshot on pure seamless white background #FFFFFF",
        "model_p": "editorial streetwear photo of female model wearing black suede winter sneakers with shearling fur trim, pure seamless white background #FFFFFF",
    },
    {
        "slug": "sneaker_2",
        "mockup_p": "rich chocolate brown velvety suede winter sneakers with soft shearling fur collar lining, chunky designer sole, studio packshot on pure seamless white background #FFFFFF",
        "model_p": "high-fashion streetwear editorial of female model wearing chocolate brown suede winter sneakers, pure seamless white background #FFFFFF",
    },
    {
        "slug": "sneaker_3",
        "mockup_p": "grey suede and textured snakeskin low-top winter sneakers with plush grey fur lining, thick rubber sole, studio packshot on pure seamless white background #FFFFFF",
        "model_p": "fashion editorial photo of female model wearing grey textured fur winter sneakers, avant-garde styling, pure seamless white background #FFFFFF",
    },
    {
        "slug": "sneaker_4",
        "mockup_p": "ivory off-white smooth calfskin high-top chunky ankle sneaker boots with polished gold link buckle strap, platform sole, studio packshot on pure seamless white background #FFFFFF",
        "model_p": "editorial photo of female model wearing ivory chunky high-top sneaker boots with gold buckle, pure seamless white background #FFFFFF",
    },
    {
        "slug": "sneaker_5",
        "mockup_p": "chocolate brown and taupe technical mesh leather luxury platform runner sneakers, chunky white and brown sole, studio packshot on pure seamless white background #FFFFFF",
        "model_p": "sporty chic fashion editorial of female model wearing brown platform designer runner sneakers, pure seamless white background #FFFFFF",
    },

    # --- BAGS & CLUTCHES (16 items) ---
    {
        "slug": "bag_1",
        "mockup_p": "designer khaki monogram canvas structured vanity case box bag with leather top handle and gold zipper, studio packshot on pure seamless white background #FFFFFF",
        "model_p": "fashion editorial of elegant female model holding monogram canvas vanity case box bag by top handle, pure seamless white background #FFFFFF",
    },
    {
        "slug": "bag_2",
        "mockup_p": "beige neutral Saffiano leather structured luxury tote handbag with double handles and gold hardware, studio packshot on pure seamless white background #FFFFFF",
        "model_p": "editorial photography of chic female model holding beige structured Saffiano leather tote bag, pure seamless white background #FFFFFF",
    },
    {
        "slug": "bag_3",
        "mockup_p": "taupe etoupe Epsom leather Mini Kelly top handle bag with wrapped patterned silk twilly scarf on handle and gold turn-lock, studio packshot on pure seamless white background #FFFFFF",
        "model_p": "haute couture editorial of female model holding taupe leather Mini Kelly bag wrapped in silk twilly scarf, pure seamless white background #FFFFFF",
    },
    {
        "slug": "bag_4",
        "mockup_p": "cream canvas and tan beige leather half-moon crescent crossbody hobo bag with wide leather strap, studio packshot on pure seamless white background #FFFFFF",
        "model_p": "relaxed chic fashion editorial of female model wearing cream canvas and leather crescent crossbody shoulder bag, pure seamless white background #FFFFFF",
    },
    {
        "slug": "bag_5",
        "mockup_p": "nude beige quilted caviar leather luxury flap handbag with interwoven gold chain strap and interlocking CC clasp, studio packshot on pure seamless white background #FFFFFF",
        "model_p": "editorial fashion photo of female model wearing beige quilted caviar leather flap shoulder bag with gold chain, pure seamless white background #FFFFFF",
    },
    {
        "slug": "bag_6",
        "mockup_p": "quilted black chevron lambskin cylinder vanity case bag with top handle and polished gold monogram logo, studio packshot on pure seamless white background #FFFFFF",
        "model_p": "fashion editorial of woman holding black quilted leather cylindrical vanity case bag, pure seamless white background #FFFFFF",
    },
    {
        "slug": "bag_7",
        "mockup_p": "dove grey and chocolate brown bicolor grained Clemence leather Kelly 25 handbag with gold turn-lock closure, studio packshot on pure seamless white background #FFFFFF",
        "model_p": "high-fashion editorial of female model carrying bicolor grey and brown leather Kelly 25 handbag, pure seamless white background #FFFFFF",
    },
    {
        "slug": "bag_8",
        "mockup_p": "minimalist sculptural light grey calfskin curved crescent hobo shoulder bag with seamless finish, studio packshot on pure seamless white background #FFFFFF",
        "model_p": "contemporary fashion editorial of female model wearing sculptural grey curved hobo shoulder bag, pure seamless white background #FFFFFF",
    },
    {
        "slug": "bag_9",
        "mockup_p": "black GG Supreme canvas mini shoulder bag with textured silver tiger head horseshoe buckle clasp, studio packshot on pure seamless white background #FFFFFF",
        "model_p": "chic editorial of female model wearing black GG Supreme mini Dionysus shoulder bag with silver chain, pure seamless white background #FFFFFF",
    },
    {
        "slug": "bag_10",
        "mockup_p": "vibrant emerald forest green smooth calfskin mini top handle bag with bold gold VLogo emblem, studio packshot on pure seamless white background #FFFFFF",
        "model_p": "vogue style fashion editorial of female model carrying emerald green mini leather bag with gold VLogo, pure seamless white background #FFFFFF",
    },
    {
        "slug": "bag_11",
        "mockup_p": "sculptural hourglass silhouette evening handbag completely covered in glittering silver strass crystal rhinestones with B logo, studio packshot on pure seamless white background #FFFFFF",
        "model_p": "glamorous evening editorial of female model holding sparkling silver rhinestone covered hourglass bag, pure seamless white background #FFFFFF",
    },
    {
        "slug": "bag_12",
        "mockup_p": "large structured matte black calfskin tote bag with embossed Christian Dior signature branding and top handles, studio packshot on pure seamless white background #FFFFFF",
        "model_p": "editorial fashion photo of female model carrying large matte black embossed leather book tote bag, pure seamless white background #FFFFFF",
    },
    {
        "slug": "bag_13",
        "mockup_p": "brown GG Supreme monogram canvas flat envelope clutch pouch with green and red web stripe and gold GG logo, studio packshot on pure seamless white background #FFFFFF",
        "model_p": "editorial photo of female model holding GG monogram canvas zip clutch with green-red web stripe under arm, pure seamless white background #FFFFFF",
    },
    {
        "slug": "bag_14",
        "mockup_p": "blue denim jacquard quilted crossbody flap bag with antique bronze love birds buckle and sliding chain strap, studio packshot on pure seamless white background #FFFFFF",
        "model_p": "casual chic fashion editorial of female model wearing blue denim love birds crossbody flap bag, pure seamless white background #FFFFFF",
    },
    {
        "slug": "bag_15",
        "mockup_p": "deep navy blue smooth leather structured medium satchel bag with slim buckle top handles, studio packshot on pure seamless white background #FFFFFF",
        "model_p": "understated luxury fashion editorial of female model holding deep navy blue leather satchel bag, pure seamless white background #FFFFFF",
    },
    {
        "slug": "bag_16",
        "mockup_p": "luxury black satin hardcase evening clutch bag lavishly encrusted with shimmering crystals and polished gold VLogo hardware, studio packshot on pure seamless white background #FFFFFF",
        "model_p": "red carpet glamorous evening editorial of elegant female model holding sparkling crystal black satin evening clutch, pure seamless white background #FFFFFF",
    },

    # --- HEADWEAR & BELTS (7 items) ---
    {
        "slug": "cap_1",
        "mockup_p": "dusty mauve rose jacquard monogram canvas 6-panel baseball cap with curved visor, studio packshot on pure seamless white background #FFFFFF",
        "model_p": "streetwear fashion editorial of attractive female model wearing dusty mauve monogram baseball cap, pure seamless white background #FFFFFF",
    },
    {
        "slug": "cap_2",
        "mockup_p": "crisp pure white cotton twill baseball cap with minimalist black embroidered designer logo, studio packshot on pure seamless white background #FFFFFF",
        "model_p": "sporty chic fashion editorial of female model wearing crisp white embroidered baseball cap, pure seamless white background #FFFFFF",
    },
    {
        "slug": "cap_3",
        "mockup_p": "soft pastel baby pink cotton baseball cap with off-white embroidered Triomphe emblem, studio packshot on pure seamless white background #FFFFFF",
        "model_p": "fresh fashion editorial of female model wearing baby pink cotton baseball cap, pure seamless white background #FFFFFF",
    },
    {
        "slug": "hat_1",
        "mockup_p": "fine woven ivory white natural straw cloche sun hat adorned with champagne satin ribbon bow and pearl brooch, studio packshot on pure seamless white background #FFFFFF",
        "model_p": "elegant summer editorial of female model wearing fine ivory woven straw cloche sun hat with champagne ribbon, pure seamless white background #FFFFFF",
    },
    {
        "slug": "hat_2",
        "mockup_p": "chic black woven straw bucket hat featuring white pearl trimmed ribbon band and camellia floral embellishment, studio packshot on pure seamless white background #FFFFFF",
        "model_p": "parisian chic fashion editorial of female model wearing black woven straw bucket hat with pearls, pure seamless white background #FFFFFF",
    },
    {
        "slug": "hat_3",
        "mockup_p": "warm tan natural woven straw cloche bucket hat with black grosgrain ribbon band and delicate pearl edge, studio packshot on pure seamless white background #FFFFFF",
        "model_p": "resort fashion editorial of female model wearing natural tan straw cloche hat with black band, pure seamless white background #FFFFFF",
    },
    {
        "slug": "belt_1",
        "mockup_p": "luxurious black smooth calfskin leather waist belt with gleaming polished gold turn-lock closure buckle, coiled studio packshot on pure seamless white background #FFFFFF",
        "model_p": "fashion editorial photo of female model wearing black leather waist belt with gold turn-lock buckle over chic white blazer, pure seamless white background #FFFFFF",
    },

    # --- PERFUMES (9 items) ---
    {
        "slug": "perfume_1",
        "mockup_p": "luxury obsidian black cylindrical perfume bottle with faceted golden tiger eye gemstone cap and gold collar, high-end fragrance packshot on pure seamless white background #FFFFFF",
        "model_p": "high fashion editorial of elegant female model gently holding luxury black and gold gemstone perfume bottle, pure seamless white background #FFFFFF",
    },
    {
        "slug": "perfume_2",
        "mockup_p": "luxury studded rockstud clear crystal glass perfume bottle with rose pink fragrance and edgy black studded cap, studio packshot on pure seamless white background #FFFFFF",
        "model_p": "vogue beauty editorial of glamorous female model holding studded crystal rockstud perfume bottle, pure seamless white background #FFFFFF",
    },
    {
        "slug": "perfume_3",
        "mockup_p": "architectural rectangular clear glass perfume bottle with rich amber juice wrapped in oversized gold YSL monogram with black asymmetric cap, studio packshot on pure seamless white background #FFFFFF",
        "model_p": "beauty campaign editorial of fierce female model holding oversized gold monogram perfume bottle, pure seamless white background #FFFFFF",
    },
    {
        "slug": "perfume_4",
        "mockup_p": "chic low cylindrical ribbed glass perfume bottle with bright amber liquid and cheerful saffron yellow round cap, studio packshot on pure seamless white background #FFFFFF",
        "model_p": "sunlit editorial portrait of female model holding ribbed round glass perfume bottle with yellow cap, pure seamless white background #FFFFFF",
    },
    {
        "slug": "perfume_5",
        "mockup_p": "pure glossy white architectural chessboard perfume decanter bottle with gleaming silver metal nameplate and square cap, studio packshot on pure seamless white background #FFFFFF",
        "model_p": "winter luxury beauty editorial of elegant female model holding pristine white architectural perfume bottle, pure seamless white background #FFFFFF",
    },
    {
        "slug": "perfume_6",
        "mockup_p": "crisp cubic clear glass perfume bottle with sparkling blue-silver fragrance and zinc metal cap, studio packshot on pure seamless white background #FFFFFF",
        "model_p": "minimalist beauty editorial portrait of female model holding cubic clear glass perfume bottle, pure seamless white background #FFFFFF",
    },
    {
        "slug": "perfume_7",
        "mockup_p": "tall slender clear glass perfume bottle with radiant turquoise gold label and polished brass cap, luxury fragrance packshot on pure seamless white background #FFFFFF",
        "model_p": "haute couture beauty editorial of female model holding tall elegant perfume bottle with brass cap, pure seamless white background #FFFFFF",
    },
    {
        "slug": "perfume_8",
        "mockup_p": "curved clear glass royal perfume bottle with embossed silver and gold floral crest and white leather textured wrap, studio packshot on pure seamless white background #FFFFFF",
        "model_p": "regal beauty editorial of elegant female model holding luxury royal curved glass perfume bottle, pure seamless white background #FFFFFF",
    },
    {
        "slug": "perfume_9",
        "mockup_p": "fluid clear glass perfume bottle topped with dramatic polished silver twisting aerodynamic sculpted metal cap, high-end packshot on pure seamless white background #FFFFFF",
        "model_p": "avant-garde luxury beauty editorial of female model holding fluid glass perfume bottle with sculptural silver cap, pure seamless white background #FFFFFF",
    },

    # --- LOTIONS (6 items) ---
    {
        "slug": "lotion_1",
        "mockup_p": "luxury tall black cylindrical fragrance body lotion bottle with polished gold pump and ornate gold floral motif, studio packshot on pure seamless white background #FFFFFF",
        "model_p": "skincare luxury editorial of female model holding elegant black and gold body lotion pump bottle, pure seamless white background #FFFFFF",
    },
    {
        "slug": "lotion_2",
        "mockup_p": "soft blush pink and shimmering gold gradient fragrance body lotion tube with gold cap, studio packshot on pure seamless white background #FFFFFF",
        "model_p": "beauty glow editorial of female model applying fragrance lotion from blush pink and gold shimmer tube, pure seamless white background #FFFFFF",
    },
    {
        "slug": "lotion_3",
        "mockup_p": "iconic bright warm yellow body cream jar with pristine white twist-off lid and pistachio caramel graphics, studio packshot on pure seamless white background #FFFFFF",
        "model_p": "healthy glow beauty editorial of female model holding vibrant yellow luxury body cream jar, pure seamless white background #FFFFFF",
    },
    {
        "slug": "lotion_4",
        "mockup_p": "minimalist pure white cylindrical body lotion bottle with clean black typography and black dispenser pump, studio packshot on pure seamless white background #FFFFFF",
        "model_p": "minimalist clean beauty editorial of female model holding pure white typographic body lotion bottle, pure seamless white background #FFFFFF",
    },
    {
        "slug": "lotion_5",
        "mockup_p": "square clear glass body lotion bottle with black dispenser pump and vintage cream label with black border, studio packshot on pure seamless white background #FFFFFF",
        "model_p": "timeless british elegance editorial of female model holding classic clear glass pump lotion bottle, pure seamless white background #FFFFFF",
    },
    {
        "slug": "lotion_6",
        "mockup_p": "amber brown frosted apothecary body lotion pump bottle with modern minimalist white geometric typography, studio packshot on pure seamless white background #FFFFFF",
        "model_p": "contemporary beauty editorial of female model holding amber frosted pump body lotion bottle, pure seamless white background #FFFFFF",
    },
]


def main():
    print(f"Loading local SD-Turbo on MPS...")
    pipe = AutoPipelineForText2Image.from_pretrained(
        "stabilityai/sd-turbo",
        torch_dtype=torch.float16,
        variant="fp16",
        local_files_only=True
    ).to("mps")
    print("Pipeline ready!")

    total = len(ITEMS)
    generated = 0

    for idx, item in enumerate(ITEMS, 1):
        if item.get("type") == "banner":
            fn = item["filename"]
            target_path = os.path.join(OUT_DIR, fn)
            if not os.path.exists(target_path) or os.path.getsize(target_path) < 2000:
                print(f"[{idx}/{total}] Generating Banner: {fn}...")
                img = pipe(
                    item["prompt"],
                    width=item.get("width", 896),
                    height=item.get("height", 448),
                    num_inference_steps=2,
                    guidance_scale=0.0
                ).images[0]
                img.save(target_path, quality=95)
                generated += 1
            else:
                print(f"[{idx}/{total}] Banner already exists: {fn}")
            continue

        slug = item["slug"]
        mockup_fn = f"{slug}_mockup.jpg"
        model_fn = f"{slug}_model.jpg"
        mockup_path = os.path.join(OUT_DIR, mockup_fn)
        model_path = os.path.join(OUT_DIR, model_fn)

        # 1. Mockup (packshot 512x512)
        if not os.path.exists(mockup_path) or os.path.getsize(mockup_path) < 2000:
            print(f"[{idx}/{total}] Gen mockup for {slug}...")
            img_mockup = pipe(
                item["mockup_p"],
                width=512,
                height=512,
                num_inference_steps=2,
                guidance_scale=0.0
            ).images[0]
            img_mockup.save(mockup_path, quality=95)
            generated += 1
        else:
            print(f"[{idx}/{total}] Mockup exists for {slug}")

        # 2. Model (vertical 512x640)
        if not os.path.exists(model_path) or os.path.getsize(model_path) < 2000:
            print(f"[{idx}/{total}] Gen model for {slug}...")
            img_model = pipe(
                item["model_p"],
                width=512,
                height=640,
                num_inference_steps=2,
                guidance_scale=0.0
            ).images[0]
            img_model.save(model_path, quality=95)
            generated += 1
        else:
            print(f"[{idx}/{total}] Model exists for {slug}")

    print(f"\nCompleted! Generated {generated} new images in {OUT_DIR}.")


if __name__ == "__main__":
    main()
