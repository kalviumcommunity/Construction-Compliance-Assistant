"""
Basic Chat Completion Script
Demonstrates safe configuration via environment variables (.env),
request/response and token usage logging, and human-readable error handling.
"""

import os
import sys
import logging
import json
from dotenv import load_dotenv
from openai import OpenAI, AuthenticationError, RateLimitError, APIConnectionError, APIStatusError

# Configure standard logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)


def load_client_configuration():
    """
    Task 1: Read configuration safely from environment (.env).
    Returns client instance, model_name, and configuration details.
    """
    # Load .env file if available
    load_dotenv()

    api_key = os.getenv("OPENAI_API_KEY")
    base_url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
    model_name = os.getenv("OPENAI_MODEL_NAME", "gpt-3.5-turbo")

    if not api_key:
        logger.error(
            "Configuration Error: OPENAI_API_KEY is not set in environment or .env file.\n"
            "Please copy backend/.env.example to backend/.env and set your OPENAI_API_KEY."
        )
        return None, None, None

    logger.info("Initializing OpenAI client:")
    logger.info(f"  - Base URL : {base_url}")
    logger.info(f"  - Model    : {model_name}")
    masked_key = api_key[:7] + "..." + api_key[-4:] if len(api_key) > 12 else "***"
    logger.info(f"  - API Key  : {masked_key}")

    client = OpenAI(
        api_key=api_key,
        base_url=base_url
    )
    return client, model_name, base_url


def run_chat_completion(client: OpenAI, model_name: str, prompt: str = "Explain the importance of construction compliance in 2 sentences."):
    """
    Tasks 2, 3, & 4:
    - Send request with system and user messages.
    - Log outgoing request and incoming response (including token usage).
    - Handle 401 (auth), 429 (rate limit), connection, and API status errors cleanly.
    """
    messages = [
        {
            "role": "system",
            "content": "You are a professional assistant specialized in construction regulations and building code compliance."
        },
        {
            "role": "user",
            "content": prompt
        }
    ]

    # Task 3: Log outgoing request payload
    logger.info("=" * 60)
    logger.info("OUTGOING REQUEST PAYLOAD:")
    logger.info(f"Model: {model_name}")
    logger.info(f"Messages: {json.dumps(messages, indent=2)}")
    logger.info("=" * 60)

    try:
        # Task 2: Send request
        response = client.chat.completions.create(
            model=model_name,
            messages=messages,
            temperature=0.7
        )

        # Task 2 & 3: Print response and log details
        reply = response.choices[0].message.content

        logger.info("INCOMING RESPONSE:")
        logger.info(f"Response ID : {response.id}")
        logger.info(f"Model Used  : {response.model}")
        if response.usage:
            logger.info("TOKEN USAGE:")
            logger.info(f"  - Prompt Tokens     : {response.usage.prompt_tokens}")
            logger.info(f"  - Completion Tokens : {response.usage.completion_tokens}")
            logger.info(f"  - Total Tokens      : {response.usage.total_tokens}")

        logger.info("=" * 60)
        logger.info("MODEL TEXT REPLY:")
        print(f"\n{reply}\n")
        logger.info("=" * 60)

        return response

    # Task 4: Catch and report common failures with human-readable explanations
    except AuthenticationError as e:
        logger.error(
            "Authentication Failed (HTTP 401): The provided API key is invalid, expired, or missing.\n"
            "Action Required: Verify that 'OPENAI_API_KEY' in your .env is correct and active."
        )
        logger.debug(f"Details: {e}")
        return None

    except RateLimitError as e:
        logger.error(
            "Rate Limit Exceeded or Quota Exhausted (HTTP 429): You have sent too many requests or exceeded your account quota.\n"
            "Action Required: Wait before retrying or check your billing/credit status on your provider dashboard."
        )
        logger.debug(f"Details: {e}")
        return None

    except APIConnectionError as e:
        logger.error(
            "Connection Error: Failed to connect to the model endpoint.\n"
            "Action Required: Check your internet connection or verify the OPENAI_BASE_URL endpoint status."
        )
        logger.debug(f"Details: {e}")
        return None

    except APIStatusError as e:
        logger.error(
            f"API Error (HTTP {e.status_code}): {e.message}\n"
            "Action Required: Check request parameters, model availability, or provider status."
        )
        return None

    except Exception as e:
        logger.error(f"Unexpected Error occurred: {str(e)}")
        return None


if __name__ == "__main__":
    client, model_name, _ = load_client_configuration()
    if client:
        run_chat_completion(client, model_name)
    else:
        sys.exit(1)
