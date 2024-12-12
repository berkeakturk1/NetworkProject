from pathlib import Path

import numpy as np
import torch
from fire import Fire
from torch import Tensor
from torchvision.transforms import functional as T
from tqdm import tqdm

from . import image_utils
from .model import ImageTransformerModel


class Stylizer:
    def __init__(self, model_path: str, use_gpu: bool = True):
        self._device = 'cuda' if use_gpu and torch.cuda.is_available() else 'cpu'
        self._device = 'mps' if use_gpu and torch.backends.mps.is_available() else self._device
        self._load_model(model_path)

    def stylize(self, image: np.ndarray) -> np.ndarray:
        image_t = self._preprocess(image)
        with torch.no_grad():
            transformed_t = self._model(image_t)
        transformed = self._post_process(transformed_t)
        return transformed

    def _load_model(self, model_path: str) -> None:
        # Ensure the model path is relative to the 'src/models' directory
        model_path = Path(__file__).parent / 'models' / model_path
        self._model = ImageTransformerModel().train().to(self._device)
        weights = torch.load(model_path, map_location=torch.device(self._device))
        self._model.load_state_dict(weights)

    def _preprocess(self, image: np.ndarray) -> Tensor:
        image_t = T.to_tensor(image)
        image_t.unsqueeze_(0)
        image_t = image_t.to(self._device)
        return image_t

    @staticmethod
    def _post_process(image_t: Tensor) -> np.ndarray:
        image_t.squeeze_(0)
        image_t = image_t.detach().cpu()
        image_pil = T.to_pil_image(image_t)
        image = image_utils.to_numpy(image_pil)
        image = image[:, :, ::-1].copy()
        return (image * 255).astype('uint8')


def stylize(model_path: str, image_path: str, output_path: str) -> None:
    base_dir = Path(__file__).parent
    model_path = str(base_dir / 'models' / model_path)
    image_path = str(base_dir / image_path)
    output_path = str(base_dir / output_path)

    assert image_utils.is_image(image_path)
    input_image = image_utils.load(image_path)
    stylizer = Stylizer(model_path)
    stylized_image = stylizer.stylize(input_image)
    image_utils.save(stylized_image, output_path)


def stylize_folder(model_path: str, images_path: str, outputs_path: str) -> None:
    base_dir = Path(__file__).parent
    model_path = str(base_dir / 'models' / model_path)
    images_path = str(base_dir / images_path)
    outputs_path = str(base_dir / outputs_path)

    stylizer = Stylizer(model_path)
    for image_path in tqdm(image_utils.list_images(images_path)):
        input_image = image_utils.load(image_path)
        stylized_image = stylizer.stylize(input_image)
        output_path = Path(outputs_path) / Path(image_path).name
        image_utils.save(stylized_image, output_path)


if __name__ == '__main__':
    Fire(stylize)
