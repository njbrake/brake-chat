from open_webui.retrieval.vector.main import VectorDBBase
from open_webui.retrieval.vector.type import VectorType
from open_webui.config import VECTOR_DB


class Vector:

    @staticmethod
    def get_vector(vector_type: str) -> VectorDBBase:
        """
        get vector db instance by vector type
        """
        if vector_type == VectorType.CHROMA:
            from open_webui.retrieval.vector.dbs.chroma import ChromaClient

            return ChromaClient()
        else:
            raise ValueError(
                f"Unsupported vector type: {vector_type}. Only 'chroma' is supported."
            )


VECTOR_DB_CLIENT = Vector.get_vector(VECTOR_DB)
